import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { OrderReturnItem, PaginatedResult } from '@tobetake/shared-types';

@Injectable()
export class SellerReturnsService {
  private readonly logger = new Logger(SellerReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReturns(
    sellerId: string,
    query: { search?: string; status?: string; page?: number; limit?: number },
  ): Promise<PaginatedResult<OrderReturnItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderReturnWhereInput = { sellerId };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { returnNumber: { contains: searchTerm, mode: 'insensitive' } },
        { reason: { contains: searchTerm, mode: 'insensitive' } },
        { order: { orderNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, returns] = await Promise.all([
      this.prisma.orderReturn.count({ where }),
      this.prisma.orderReturn.findMany({
        where,
        include: {
          order: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: OrderReturnItem[] = returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      customerEmail: r.customer.email,
      sellerId: r.sellerId,
      reason: r.reason,
      status: r.status,
      refundStatus: r.refundStatus,
      refundAmount: Number(r.refundAmount),
      adminNotes: null, // Redacted
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
