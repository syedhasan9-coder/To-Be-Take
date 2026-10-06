import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  PrismaService,
} from '@tobetake/database';
import {
  OrderDetailItem,
  OrderItemDto,
  OrderListItem,
  PaginatedResult,
} from '@tobetake/shared-types';
import { UpdateSellerOrderStatusDto } from '../dto/update-seller-order-status.dto';

@Injectable()
export class SellerOrdersService {
  private readonly logger = new Logger(SellerOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrders(
    sellerId: string,
    query: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<OrderListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const orderWhere: Prisma.OrderWhereInput = {
      items: {
        some: {
          sellerId,
        },
      },
    };

    if (query.status) {
      orderWhere.status = query.status as OrderStatus;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      orderWhere.OR = [
        { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
        { customer: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.findMany({
        where: orderWhere,
        include: {
          customer: true,
          items: {
            where: { sellerId },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedOrders: OrderListItem[] = orders.map((o) => {
      const sellerSubtotal = o.items.reduce(
        (sum, it) => sum + Number(it.totalPrice),
        0,
      );

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        customerEmail: o.customer.email,
        itemCount: o.items.length,
        itemsCount: o.items.length,
        status: o.status,
        paymentStatus: o.paymentStatus,
        currency: o.currency,
        subtotal: sellerSubtotal,
        shippingTotal: Number(o.shippingTotal),
        taxTotal: Number(o.taxTotal),
        discountTotal: Number(o.discountTotal),
        total: sellerSubtotal,
        totalAmount: sellerSubtotal,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    return {
      items: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(
    sellerId: string,
    orderId: string,
  ): Promise<OrderDetailItem> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          where: { sellerId }, // Strictly seller items only!
        },
        shipments: true,
        commissions: {
          where: { sellerId },
        },
        returns: {
          where: { sellerId },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order || order.items.length === 0) {
      throw new NotFoundException(
        `Order '${orderId}' not found or does not contain items from your store.`,
      );
    }

    const sellerSubtotal = order.items.reduce(
      (sum, it) => sum + Number(it.totalPrice),
      0,
    );

    const formattedItems: OrderItemDto[] = order.items.map((it) => ({
      id: it.id,
      orderId: it.orderId,
      productId: it.productId,
      sellerId: it.sellerId,
      productName: it.productName,
      productTitle: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      createdAt: it.createdAt,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      customerEmail: order.customer.email,
      itemCount: order.items.length,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      subtotal: sellerSubtotal,
      shippingTotal: Number(order.shippingTotal),
      taxTotal: Number(order.taxTotal),
      discountTotal: Number(order.discountTotal),
      total: sellerSubtotal,
      totalAmount: sellerSubtotal,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      customerNotes: order.customerNotes,
      adminNotes: null, // Admin notes redacted from seller
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      items: formattedItems,
      payments: [], // Sensitive platform payment records omitted from seller view
      shipments: order.shipments.map((s) => ({
        id: s.id,
        orderId: s.orderId,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        trackingUrl: s.trackingUrl,
        status: s.status,
        estimatedDelivery: s.estimatedDelivery,
        shippedDate: s.shippedDate,
        deliveredDate: s.deliveredDate,
        notes: s.notes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      returns: order.returns.map((r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        orderId: r.orderId,
        customerId: r.customerId,
        sellerId: r.sellerId,
        reason: r.reason,
        status: r.status,
        refundStatus: r.refundStatus,
        refundAmount: Number(r.refundAmount),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      commissions: order.commissions.map((c) => ({
        id: c.id,
        orderId: c.orderId,
        sellerId: c.sellerId,
        orderAmount: Number(c.orderAmount),
        commissionRate: Number(c.commissionRate),
        platformFee: Number(c.platformFee),
        sellerEarnings: Number(c.sellerEarnings),
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        orderId: h.orderId,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        notes: h.notes,
        actorId: h.actorId,
        actorName: h.actorName,
        createdAt: h.createdAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async updateOrderStatus(
    sellerId: string,
    orderId: string,
    dto: UpdateSellerOrderStatusDto,
  ): Promise<OrderDetailItem> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { sellerId },
        },
      },
    });

    if (!order || order.items.length === 0) {
      throw new NotFoundException(
        'Order not found or not associated with your store.',
      );
    }

    // Strict Order State Machine validation for seller fulfillment lifecycle
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowedNext = validTransitions[order.status] || [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid order status transition from '${order.status}' to '${dto.status}'.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updateData: Prisma.OrderUpdateInput = {
        status: dto.status,
      };

      if (dto.status === OrderStatus.SHIPPED && !order.shippedAt) {
        updateData.shippedAt = now;
      }
      if (dto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
        updateData.deliveredAt = now;
      }
      if (dto.status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = now;
        updateData.cancellationReason = dto.notes ?? 'Cancelled by merchant';
      }

      const res = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: dto.status,
          notes: dto.notes ?? `Status updated to ${dto.status} by merchant`,
          actorId: sellerId,
          actorName: 'Seller Merchant',
        },
      });

      return res;
    });

    return this.getOrderById(sellerId, updated.id);
  }
}
