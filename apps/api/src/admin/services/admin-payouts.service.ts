import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PayoutStatus, Prisma, PrismaService } from '@tobetake/database';
import { PaginatedResult, SellerPayoutItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { CreatePayoutDto, PayoutQueryDto, ProcessPayoutDto } from '../dto/payout.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminPayoutsService {
  private readonly logger = new Logger(AdminPayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List payouts with pagination, status filter, and seller filter.
   */
  async listPayouts(query: PayoutQueryDto): Promise<PaginatedResult<SellerPayoutItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.SellerPayoutWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { payoutNumber: { contains: s, mode: 'insensitive' } },
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
        { seller: { firstName: { contains: s, mode: 'insensitive' } } },
        { seller: { lastName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, payouts] = await Promise.all([
      this.prisma.sellerPayout.count({ where }),
      this.prisma.sellerPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
            },
          },
          _count: {
            select: { commissions: true },
          },
        },
      }),
    ]);

    return {
      items: payouts.map((p) => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        sellerId: p.sellerId,
        sellerName: `${p.seller.firstName} ${p.seller.lastName}`.trim(),
        storeName: p.seller.storeName,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        processedAt: p.processedAt,
        processedByName: null,
        notes: p.notes,
        commissionsCount: p._count.commissions,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create payout ledger request for a seller.
   */
  async createPayout(dto: CreatePayoutDto, admin: AuthenticatedAdminUser): Promise<SellerPayoutItem> {
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
      include: {
        sellerCommissions: {
          where: { payoutId: null, status: 'PENDING' },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID '${dto.sellerId}' was not found`);
    }

    const pendingEarnings = seller.sellerCommissions.reduce(
      (sum, c) => sum + Number(c.sellerEarnings),
      0,
    );

    const amount = dto.amount ?? pendingEarnings;

    if (amount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }

    const payoutNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const payout = await tx.sellerPayout.create({
        data: {
          payoutNumber,
          sellerId: dto.sellerId,
          amount,
          status: PayoutStatus.PENDING,
          notes: dto.notes || null,
        },
      });

      // Link unassigned pending commission records
      if (seller.sellerCommissions.length > 0) {
        await tx.commissionRecord.updateMany({
          where: {
            id: { in: seller.sellerCommissions.map((c) => c.id) },
          },
          data: {
            payoutId: payout.id,
          },
        });
      }

      return payout;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PAYOUT_CREATED',
      targetType: 'SellerPayout',
      targetId: created.id,
      details: {
        payoutNumber: created.payoutNumber,
        sellerId: created.sellerId,
        amount,
      },
    });

    return {
      id: created.id,
      payoutNumber: created.payoutNumber,
      sellerId: created.sellerId,
      sellerName: `${seller.firstName} ${seller.lastName}`.trim(),
      storeName: seller.storeName,
      amount: Number(created.amount),
      currency: created.currency,
      status: created.status,
      periodStart: created.periodStart,
      periodEnd: created.periodEnd,
      processedAt: created.processedAt,
      processedByName: null,
      notes: created.notes,
      commissionsCount: seller.sellerCommissions.length,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Process and disburse payout status.
   */
  async processPayout(
    id: string,
    dto: ProcessPayoutDto,
    admin: AuthenticatedAdminUser,
  ): Promise<SellerPayoutItem> {
    const payout = await this.prisma.sellerPayout.findUnique({
      where: { id },
      include: {
        seller: true,
        _count: { select: { commissions: true } },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout with ID '${id}' was not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.sellerPayout.update({
        where: { id },
        data: {
          status: dto.status,
          processedAt: dto.status === PayoutStatus.PAID ? new Date() : payout.processedAt,
          processedBy: admin.id,
          notes: dto.notes || payout.notes,
        },
      });

      if (dto.status === PayoutStatus.PAID) {
        await tx.commissionRecord.updateMany({
          where: { payoutId: id },
          data: { status: 'PAID' },
        });
      } else if (dto.status === PayoutStatus.CANCELLED || dto.status === PayoutStatus.REJECTED) {
        await tx.commissionRecord.updateMany({
          where: { payoutId: id },
          data: { payoutId: null, status: 'PENDING' },
        });
      }

      return p;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PAYOUT_STATUS_UPDATED',
      targetType: 'SellerPayout',
      targetId: id,
      details: {
        payoutNumber: payout.payoutNumber,
        fromStatus: payout.status,
        toStatus: dto.status,
        notes: dto.notes,
      },
    });

    return {
      id: updated.id,
      payoutNumber: updated.payoutNumber,
      sellerId: updated.sellerId,
      sellerName: `${payout.seller.firstName} ${payout.seller.lastName}`.trim(),
      storeName: payout.seller.storeName,
      amount: Number(updated.amount),
      currency: updated.currency,
      status: updated.status,
      periodStart: updated.periodStart,
      periodEnd: updated.periodEnd,
      processedAt: updated.processedAt,
      processedByName: admin.username,
      notes: updated.notes,
      commissionsCount: payout._count.commissions,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
