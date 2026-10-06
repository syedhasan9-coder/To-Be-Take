import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import {
  CommissionRecordItem,
  PaginatedResult,
  SellerEarningsSummary,
  SellerPayoutItem,
} from '@tobetake/shared-types';

@Injectable()
export class SellerFinanceService {
  private readonly logger = new Logger(SellerFinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getEarningsSummary(sellerId: string): Promise<SellerEarningsSummary> {
    this.logger.log(`Fetching earnings summary for seller: ${sellerId}`);

    const [commissions, payouts, returns] = await Promise.all([
      this.prisma.commissionRecord.findMany({
        where: { sellerId },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sellerPayout.findMany({
        where: { sellerId },
      }),
      this.prisma.orderReturn.findMany({
        where: { sellerId, status: 'REFUNDED' },
      }),
    ]);

    const grossSales = commissions.reduce(
      (sum, c) => sum + Number(c.orderAmount),
      0,
    );
    const platformFees = commissions.reduce(
      (sum, c) => sum + Number(c.platformFee),
      0,
    );
    const netEarnings = commissions.reduce(
      (sum, c) => sum + Number(c.sellerEarnings),
      0,
    );
    const refundDeductions = returns.reduce(
      (sum, r) => sum + Number(r.refundAmount),
      0,
    );

    const totalPaidOut = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingBalance = Math.max(0, netEarnings - totalPaidOut - refundDeductions);

    const transactions: CommissionRecordItem[] = commissions.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      orderNumber: c.order.orderNumber,
      sellerId: c.sellerId,
      payoutId: c.payoutId,
      orderAmount: Number(c.orderAmount),
      commissionRate: Number(c.commissionRate),
      ratePercent: Number(c.commissionRate),
      platformFee: Number(c.platformFee),
      platformAmount: Number(c.platformFee),
      sellerEarnings: Number(c.sellerEarnings),
      sellerAmount: Number(c.sellerEarnings),
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      grossSales,
      platformFees,
      refundDeductions,
      netEarnings,
      pendingBalance,
      totalPaidOut,
      transactions,
    };
  }

  async getCommissions(
    sellerId: string,
    query: { page?: number; limit?: number },
  ): Promise<PaginatedResult<CommissionRecordItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionRecordWhereInput = { sellerId };

    const [total, commissions] = await Promise.all([
      this.prisma.commissionRecord.count({ where }),
      this.prisma.commissionRecord.findMany({
        where,
        include: { order: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: CommissionRecordItem[] = commissions.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      orderNumber: c.order.orderNumber,
      sellerId: c.sellerId,
      payoutId: c.payoutId,
      orderAmount: Number(c.orderAmount),
      commissionRate: Number(c.commissionRate),
      ratePercent: Number(c.commissionRate),
      platformFee: Number(c.platformFee),
      platformAmount: Number(c.platformFee),
      sellerEarnings: Number(c.sellerEarnings),
      sellerAmount: Number(c.sellerEarnings),
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPayouts(
    sellerId: string,
    query: { page?: number; limit?: number },
  ): Promise<PaginatedResult<SellerPayoutItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.SellerPayoutWhereInput = { sellerId };

    const [total, payouts] = await Promise.all([
      this.prisma.sellerPayout.count({ where }),
      this.prisma.sellerPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: SellerPayoutItem[] = payouts.map((p) => ({
      id: p.id,
      payoutNumber: p.payoutNumber,
      sellerId: p.sellerId,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      processedAt: p.processedAt,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
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
