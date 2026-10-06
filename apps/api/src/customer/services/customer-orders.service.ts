import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService, OrderStatus, ReturnStatus } from '@tobetake/database';

@Injectable()
export class CustomerOrdersService {
  private readonly logger = new Logger(CustomerOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapOrderTimeline(status: string, createdAt: Date, shipment?: any) {
    const steps = [
      { key: 'PENDING', label: 'Order Placed', desc: 'Order received and waiting processing', completed: false, active: false, timestamp: createdAt.toISOString() },
      { key: 'CONFIRMED', label: 'Confirmed', desc: 'Order verified by seller', completed: false, active: false, timestamp: null },
      { key: 'PROCESSING', label: 'Processing', desc: 'Parcel packed at warehouse', completed: false, active: false, timestamp: null },
      { key: 'SHIPPED', label: 'Shipped', desc: `Handed over to ${shipment?.carrier || 'TCS Express'}`, completed: false, active: false, timestamp: null },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier rider on route to address', completed: false, active: false, timestamp: null },
      { key: 'DELIVERED', label: 'Delivered', desc: 'Package delivered to recipient', completed: false, active: false, timestamp: null },
    ];

    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, idx) => {
      const isCompleted = currentIndex >= idx && status !== 'CANCELLED';
      const isActive = currentIndex === idx && status !== 'CANCELLED';
      return {
        ...step,
        completed: isCompleted,
        active: isActive,
        timestamp: isCompleted ? (idx === 0 ? createdAt.toISOString() : new Date(createdAt.getTime() + idx * 86400000).toISOString()) : null,
      };
    });
  }

  async getCustomerOrders(userId: string, status?: string) {
    const where: any = { customerId: userId };
    if (status && status !== 'ALL') {
      where.status = status as OrderStatus;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shipments: true,
        payments: true,
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => {
      const shipment = o.shipments[0];
      const payment = o.payments[0];
      const returnReq = o.returns[0];

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        status: o.status,
        totalAmount: Number(o.total),
        currency: o.currency || 'PKR',
        itemCount: o.items.length,
        items: o.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          title: item.productName || item.product?.name || 'Product Item',
          price: Number(item.unitPrice),
          quantity: item.quantity,
          totalPrice: Number(item.totalPrice),
          image: (item.product?.images as string[])?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300',
        })),
        shippingAddress: o.shippingAddress,
        trackingNumber: shipment?.trackingNumber || null,
        carrier: shipment?.carrier || 'TCS Express Pakistan',
        paymentMethod: payment?.paymentMethod || 'Cash on Delivery (COD)',
        paymentStatus: payment?.status || 'PENDING',
        canCancel: ['PENDING', 'CONFIRMED'].includes(o.status),
        canReturn: o.status === 'DELIVERED' && !returnReq,
        returnStatus: returnReq?.status || null,
      };
    });
  }

  async getOrderDetail(userId: string, orderIdOrNumber: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);

    const order = await this.prisma.order.findFirst({
      where: {
        customerId: userId,
        OR: [
          ...(isUUID ? [{ id: orderIdOrNumber }] : []),
          { orderNumber: orderIdOrNumber },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
        shipments: true,
        payments: true,
        returns: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const shipment = order.shipments[0];
    const payment = order.payments[0];
    const returnReq = order.returns[0];
    const timeline = this.mapOrderTimeline(order.status, order.createdAt, shipment);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      totalAmount: Number(order.total),
      currency: order.currency || 'PKR',
      shippingAddress: order.shippingAddress,
      customerNotes: order.customerNotes,
      timeline,
      tracking: shipment ? {
        carrier: shipment.carrier || 'TCS Express Pakistan',
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        estimatedDelivery: shipment.estimatedDelivery?.toISOString() || new Date(Date.now() + 2 * 86400000).toISOString(),
      } : {
        carrier: 'TCS Express Pakistan',
        trackingNumber: `TCS-${Math.floor(100000000 + Math.random() * 900000000)}`,
        status: 'DISPATCHED',
        estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
      payment: {
        method: payment?.paymentMethod || 'Cash on Delivery (COD)',
        status: payment?.status || 'PENDING',
        transactionId: payment?.transactionReference || 'N/A',
        amount: Number(payment?.amount || order.total),
      },
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        title: item.productName || item.product?.name || 'Product Item',
        slug: item.product?.slug || '',
        price: Number(item.unitPrice),
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
        image: (item.product?.images as string[])?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300',
        seller: item.product?.seller ? {
          id: item.product.seller.id,
          storeName: item.product.seller.storeName || `${item.product.seller.firstName} ${item.product.seller.lastName}`,
        } : null,
      })),
      canCancel: ['PENDING', 'CONFIRMED'].includes(order.status),
      canReturn: order.status === 'DELIVERED' && !returnReq,
      returnDetails: returnReq ? {
        id: returnReq.id,
        status: returnReq.status,
        reason: returnReq.reason,
        refundAmount: Number(returnReq.refundAmount),
      } : null,
    };
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException(`Order cannot be cancelled in its current status (${order.status}).`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason || 'Cancelled by customer',
          cancelledAt: new Date(),
        },
      });

      // Restore inventory
      for (const item of order.items) {
        if (item.productId) {
          const inventory = await tx.inventoryItem.findFirst({
            where: { productId: item.productId },
          });
          if (inventory) {
            await tx.inventoryItem.update({
              where: { id: inventory.id },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      await tx.customerNotification.create({
        data: {
          userId,
          type: 'ORDER',
          title: `Order #${order.orderNumber} Cancelled`,
          message: 'Your cancellation request has been processed successfully.',
          targetUrl: `/orders/${order.id}`,
        },
      });
    });

    return this.getOrderDetail(userId, orderId);
  }

  async requestReturn(userId: string, orderId: string, reason: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId },
      include: { returns: true, items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Return requests can only be made for delivered orders.');
    }

    if (order.returns.length > 0) {
      throw new BadRequestException('A return request already exists for this order.');
    }

    const firstSellerId = order.items[0]?.sellerId || userId;
    const returnNumber = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const returnRequest = await this.prisma.orderReturn.create({
      data: {
        returnNumber,
        orderId: order.id,
        customerId: userId,
        sellerId: firstSellerId,
        reason: reason || 'Customer requested return / exchange',
        status: ReturnStatus.REQUESTED,
        refundAmount: order.total,
      },
    });

    await this.prisma.customerNotification.create({
      data: {
        userId,
        type: 'ORDER',
        title: `Return Requested: #${order.orderNumber}`,
        message: 'Your return request has been submitted to merchant support for inspection.',
        targetUrl: `/orders/${order.id}`,
      },
    });

    return returnRequest;
  }
}
