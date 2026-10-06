import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import {
  CommissionRecordItem,
  CommissionSummaryData,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { CommissionQueryDto, UpdateCommissionRateDto } from '../dto/commission.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminCommissionsService {
  private readonly logger = new Logger(AdminCommissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List commission records with pagination and filtering.
   */
  async listCommissions(
    query: CommissionQueryDto,
  ): Promise<PaginatedResult<CommissionRecordItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionRecordWhereInput = {};

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
        { seller: { firstName: { contains: s, mode: 'insensitive' } } },
        { seller: { lastName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, records] = await Promise.all([
      this.prisma.commissionRecord.count({ where }),
      this.prisma.commissionRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
            },
          },
        },
      }),
    ]);

    return {
      items: records.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        sellerId: r.sellerId,
        sellerName: `${r.seller.firstName} ${r.seller.lastName}`.trim(),
        storeName: r.seller.storeName,
        payoutId: r.payoutId,
        orderAmount: Number(r.orderAmount),
        commissionRate: Number(r.commissionRate),
        platformFee: Number(r.platformFee),
        sellerEarnings: Number(r.sellerEarnings),
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get marketplace-wide commission overview summary.
   */
  async getCommissionSummary(): Promise<CommissionSummaryData> {
    const [records, rateSetting] = await Promise.all([
      this.prisma.commissionRecord.findMany({
        select: {
          platformFee: true,
          sellerEarnings: true,
          status: true,
        },
      }),
      this.prisma.platformSetting.findUnique({
        where: { key: 'platform_commission_rate' },
      }),
    ]);

    const totalPlatformFee = records.reduce((sum, r) => sum + Number(r.platformFee), 0);
    const totalSellerEarnings = records.reduce((sum, r) => sum + Number(r.sellerEarnings), 0);
    const pendingCommissions = records
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.platformFee), 0);

    const defaultCommissionRate = rateSetting ? Number(rateSetting.value) || 10 : 10;

    return {
      totalPlatformFee,
      totalSellerEarnings,
      pendingCommissions,
      defaultCommissionRate,
    };
  }

  /**
   * Update platform-wide default commission rate percentage.
   */
  async updateDefaultCommissionRate(
    dto: UpdateCommissionRateDto,
    admin: AuthenticatedAdminUser,
  ): Promise<CommissionSummaryData> {
    await this.prisma.platformSetting.upsert({
      where: { key: 'platform_commission_rate' },
      update: {
        value: String(dto.defaultRate),
        updatedBy: admin.id,
      },
      create: {
        key: 'platform_commission_rate',
        value: String(dto.defaultRate),
        description: 'Default platform marketplace commission rate percentage',
        category: 'FINANCE',
        isPublic: true,
        updatedBy: admin.id,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'COMMISSION_RATE_UPDATED',
      targetType: 'PlatformSetting',
      targetId: 'platform_commission_rate',
      details: {
        defaultRate: dto.defaultRate,
      },
    });

    return this.getCommissionSummary();
  }
}
