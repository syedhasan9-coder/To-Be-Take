import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, ProductStatus } from '@tobetake/database';
import {
  SellerDashboardData,
  SellerDashboardKpis,
} from '@tobetake/shared-types';

@Injectable()
export class SellerDashboardService {
  private readonly logger = new Logger(SellerDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(sellerId: string): Promise<SellerDashboardData> {
    this.logger.log(`Fetching seller dashboard for sellerId: ${sellerId}`);

    // 1. Fetch seller's products & inventory
    const products = await this.prisma.product.findMany({
      where: { sellerId, isDeleted: false },
      include: {
        inventory: true,
        category: true,
      },
    });

    const activeProducts = products.filter(
      (p) => p.status === ProductStatus.ACTIVE,
    ).length;

    const lowStockAlerts = products
      .filter(
        (p) =>
          p.inventory &&
          p.inventory.stockQuantity <= p.inventory.lowStockThreshold,
      )
      .map((p) => ({
        id: p.inventory!.id,
        productId: p.id,
        productName: p.name,
        productTitle: p.name,
        sku: p.sku,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        sellerId: p.sellerId,
        stockQuantity: p.inventory!.stockQuantity,
        currentStock: p.inventory!.stockQuantity,
        reservedQuantity: p.inventory!.reservedQuantity,
        reservedStock: p.inventory!.reservedQuantity,
        availableQuantity: Math.max(
          0,
          p.inventory!.stockQuantity - p.inventory!.reservedQuantity,
        ),
        availableStock: Math.max(
          0,
          p.inventory!.stockQuantity - p.inventory!.reservedQuantity,
        ),
        lowStockThreshold: p.inventory!.lowStockThreshold,
        isLowStock:
          p.inventory!.stockQuantity <= p.inventory!.lowStockThreshold,
        isOutOfStock: p.inventory!.stockQuantity === 0,
        location: p.inventory!.location,
        updatedAt: p.inventory!.updatedAt,
      }));

    const lowStockProductsCount = lowStockAlerts.length;
    const outOfStockProductsCount = products.filter(
      (p) => p.inventory && p.inventory.stockQuantity === 0,
    ).length;

    // 2. Fetch seller's order items
    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId },
      include: {
        order: {
          include: {
            customer: true,
            shipments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract unique orders belonging to this seller
    const orderMap = new Map<string, typeof orderItems[0]['order']>();
    for (const item of orderItems) {
      if (!orderMap.has(item.orderId)) {
        orderMap.set(item.orderId, item.order);
      }
    }
    const uniqueOrders = Array.from(orderMap.values());

    // 3. Commissions & Earnings
    const commissions = await this.prisma.commissionRecord.findMany({
      where: { sellerId },
    });

    const totalSales = orderItems.reduce(
      (acc, item) => acc + Number(item.totalPrice),
      0,
    );
    const totalPlatformFees = commissions.reduce(
      (acc, c) => acc + Number(c.platformFee),
      0,
    );
    const netSales = commissions.reduce(
      (acc, c) => acc + Number(c.sellerEarnings),
      0,
    );

    // 4. Payouts
    const payouts = await this.prisma.sellerPayout.findMany({
      where: { sellerId },
    });

    const totalPaidPayouts = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const pendingPayout = payouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    // 5. Order breakdown
    const pendingOrders = uniqueOrders.filter((o) => o.status === 'PENDING').length;
    const processingOrders = uniqueOrders.filter(
      (o) => o.status === 'PROCESSING' || o.status === 'CONFIRMED',
    ).length;
    const shippedOrders = uniqueOrders.filter((o) => o.status === 'SHIPPED').length;
    const deliveredOrders = uniqueOrders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = uniqueOrders.filter((o) => o.status === 'CANCELLED').length;

    const returns = await this.prisma.orderReturn.findMany({
      where: { sellerId },
    });
    const returnedOrders = returns.length;

    const averageOrderValue =
      uniqueOrders.length > 0 ? totalSales / uniqueOrders.length : 0;

    const kpis: SellerDashboardKpis = {
      totalSales,
      netSales: netSales > 0 ? netSales : totalSales - totalPlatformFees,
      totalOrders: uniqueOrders.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      activeProducts,
      lowStockProducts: lowStockProductsCount,
      outOfStockProducts: outOfStockProductsCount,
      pendingPayout,
      totalPaidPayouts,
      totalPlatformFees,
      averageOrderValue,
    };

    // 6. Recent Orders formatted
    const recentOrders = uniqueOrders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      customerEmail: o.customer.email,
      itemCount: orderItems.filter((it) => it.orderId === o.id).length,
      status: o.status,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      subtotal: Number(
        orderItems
          .filter((it) => it.orderId === o.id)
          .reduce((sum, it) => sum + Number(it.totalPrice), 0),
      ),
      shippingTotal: Number(o.shippingTotal),
      taxTotal: Number(o.taxTotal),
      discountTotal: Number(o.discountTotal),
      total: Number(
        orderItems
          .filter((it) => it.orderId === o.id)
          .reduce((sum, it) => sum + Number(it.totalPrice), 0),
      ),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    // 7. Top Products
    const productSalesMap = new Map<string, number>();
    for (const item of orderItems) {
      if (item.productId) {
        productSalesMap.set(
          item.productId,
          (productSalesMap.get(item.productId) || 0) + item.quantity,
        );
      }
    }

    const topProducts = products
      .slice()
      .sort((a, b) => {
        const salesA = productSalesMap.get(a.id) || 0;
        const salesB = productSalesMap.get(b.id) || 0;
        return salesB - salesA;
      })
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        status: p.status,
        images: p.images,
        stockQuantity: p.inventory?.stockQuantity ?? 0,
        isDeleted: p.isDeleted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

    // 8. Recent Reviews
    const reviews = await this.prisma.productReview.findMany({
      where: { sellerId },
      include: {
        product: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentReviews = reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      customerEmail: r.customer.email,
      sellerId: r.sellerId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      isReported: r.isReported,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // 9. Recent notifications
    const recentNotifications = await this.prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      kpis,
      recentOrders,
      topProducts,
      lowStockAlerts: lowStockAlerts.slice(0, 5),
      recentReviews,
      recentNotifications: recentNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        targetUrl: n.targetUrl,
        isRead: n.isRead,
        readAt: n.readAt,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
    };
  }
}
