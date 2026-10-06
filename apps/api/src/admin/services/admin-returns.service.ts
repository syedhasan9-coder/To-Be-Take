import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma, PrismaService, ReturnStatus } from '@tobetake/database';
import { OrderReturnItem, PaginatedResult } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { ReturnQueryDto, ReviewReturnDto } from '../dto/return.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminReturnsService {
  private readonly logger = new Logger(AdminReturnsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List return and refund requests with filtering.
   */
  async listReturns(query: ReturnQueryDto): Promise<PaginatedResult<OrderReturnItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderReturnWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.orderId) {
      where.orderId = query.orderId;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { returnNumber: { contains: s, mode: 'insensitive' } },
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, returns] = await Promise.all([
      this.prisma.orderReturn.count({ where }),
      this.prisma.orderReturn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
      items: returns.map((r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        customerId: r.customerId,
        customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
        customerEmail: r.customer.email,
        sellerId: r.sellerId,
        sellerName: `${r.seller.firstName} ${r.seller.lastName}`.trim(),
        storeName: r.seller.storeName,
        reason: r.reason,
        status: r.status,
        refundStatus: r.refundStatus,
        refundAmount: Number(r.refundAmount),
        adminNotes: r.adminNotes,
        reviewedByName: null,
        reviewedAt: r.reviewedAt,
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
   * Get single return request details.
   */
  async getReturnDetails(id: string): Promise<OrderReturnItem> {
    const r = await this.prisma.orderReturn.findUnique({
      where: { id },
      include: {
        order: true,
        customer: true,
        seller: true,
      },
    });

    if (!r) {
      throw new NotFoundException(`Return request with ID '${id}' was not found`);
    }

    return {
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      customerEmail: r.customer.email,
      sellerId: r.sellerId,
      sellerName: `${r.seller.firstName} ${r.seller.lastName}`.trim(),
      storeName: r.seller.storeName,
      reason: r.reason,
      status: r.status,
      refundStatus: r.refundStatus,
      refundAmount: Number(r.refundAmount),
      adminNotes: r.adminNotes,
      reviewedByName: null,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * Review and moderate a return/refund request.
   */
  async reviewReturn(
    id: string,
    dto: ReviewReturnDto,
    admin: AuthenticatedAdminUser,
  ): Promise<OrderReturnItem> {
    const existing = await this.prisma.orderReturn.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existing) {
      throw new NotFoundException(`Return request with ID '${id}' was not found`);
    }

    const isRefunded = dto.status === ReturnStatus.REFUNDED;
    const finalRefundStatus =
      dto.refundStatus || (isRefunded ? PaymentStatus.REFUNDED : existing.refundStatus);

    const updated = await this.prisma.orderReturn.update({
      where: { id },
      data: {
        status: dto.status,
        refundStatus: finalRefundStatus,
        refundAmount: dto.refundAmount !== undefined ? dto.refundAmount : existing.refundAmount,
        adminNotes: dto.adminNotes || existing.adminNotes,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
      include: {
        order: true,
        customer: true,
        seller: true,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'RETURN_REQUEST_REVIEWED',
      targetType: 'OrderReturn',
      targetId: id,
      details: {
        returnNumber: existing.returnNumber,
        previousStatus: existing.status,
        newStatus: dto.status,
        refundStatus: finalRefundStatus,
        refundAmount: updated.refundAmount,
        notes: dto.adminNotes,
      },
    });

    return {
      id: updated.id,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      orderNumber: updated.order.orderNumber,
      customerId: updated.customerId,
      customerName: `${updated.customer.firstName} ${updated.customer.lastName}`.trim(),
      customerEmail: updated.customer.email,
      sellerId: updated.sellerId,
      sellerName: `${updated.seller.firstName} ${updated.seller.lastName}`.trim(),
      storeName: updated.seller.storeName,
      reason: updated.reason,
      status: updated.status,
      refundStatus: updated.refundStatus,
      refundAmount: Number(updated.refundAmount),
      adminNotes: updated.adminNotes,
      reviewedByName: admin.username,
      reviewedAt: updated.reviewedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
