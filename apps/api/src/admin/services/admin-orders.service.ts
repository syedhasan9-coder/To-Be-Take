import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma, PrismaService } from '@tobetake/database';
import { OrderDetailItem, OrderListItem, PaginatedResult } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { OrderQueryDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List orders with pagination, search, status filters, date range, and seller/customer filters.
   */
  async listOrders(query: OrderQueryDto): Promise<PaginatedResult<OrderListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.sellerId) {
      where.items = {
        some: {
          sellerId: query.sellerId,
        },
      };
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { customer: { email: { contains: s, mode: 'insensitive' } } },
        { customer: { username: { contains: s, mode: 'insensitive' } } },
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

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (['orderNumber', 'total', 'createdAt', 'status', 'paymentStatus'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.OrderOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
        customerEmail: o.customer.email,
        itemCount: o._count.items,
        status: o.status,
        paymentStatus: o.paymentStatus,
        currency: o.currency,
        subtotal: Number(o.subtotal),
        shippingTotal: Number(o.shippingTotal),
        taxTotal: Number(o.taxTotal),
        discountTotal: Number(o.discountTotal),
        total: Number(o.total),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single order details with all associations.
   */
  async getOrderDetails(id: string): Promise<OrderDetailItem> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                storeName: true,
                email: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
        returns: {
          include: {
            customer: true,
            seller: true,
          },
        },
        commissions: {
          include: {
            seller: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' was not found`);
    }

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
      subtotal: Number(order.subtotal),
      shippingTotal: Number(order.shippingTotal),
      taxTotal: Number(order.taxTotal),
      discountTotal: Number(order.discountTotal),
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        sellerId: item.sellerId,
        sellerName: `${item.seller.firstName} ${item.seller.lastName}`.trim(),
        storeName: item.seller.storeName,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        createdAt: item.createdAt,
      })),
      payments: order.payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
        customerEmail: order.customer.email,
        transactionReference: p.transactionReference,
        paymentMethod: p.paymentMethod,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        failureReason: p.failureReason,
        metadata: p.metadata,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      shipments: order.shipments.map((s) => ({
        id: s.id,
        orderId: s.orderId,
        orderNumber: order.orderNumber,
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
        orderNumber: order.orderNumber,
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
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      commissions: order.commissions.map((c) => ({
        id: c.id,
        orderId: c.orderId,
        orderNumber: order.orderNumber,
        sellerId: c.sellerId,
        sellerName: `${c.seller.firstName} ${c.seller.lastName}`.trim(),
        storeName: c.seller.storeName,
        payoutId: c.payoutId,
        orderAmount: Number(c.orderAmount),
        commissionRate: Number(c.commissionRate),
        platformFee: Number(c.platformFee),
        sellerEarnings: Number(c.sellerEarnings),
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      statusHistory: order.statusHistory.map((sh) => ({
        id: sh.id,
        orderId: sh.orderId,
        fromStatus: sh.fromStatus,
        toStatus: sh.toStatus,
        notes: sh.notes,
        actorId: sh.actorId,
        actorName: sh.actorName,
        createdAt: sh.createdAt,
      })),
    };
  }

  /**
   * Update order status with lifecycle validation and history tracking.
   */
  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    admin: AuthenticatedAdminUser,
  ): Promise<OrderDetailItem> {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException(`Order with ID '${id}' was not found`);
    }

    if (existing.status === OrderStatus.CANCELLED && dto.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot change status of a cancelled order');
    }

    const timestampUpdates: Partial<{
      confirmedAt: Date;
      shippedAt: Date;
      deliveredAt: Date;
      cancelledAt: Date;
      cancellationReason: string;
      adminNotes: string;
    }> = {};

    const now = new Date();
    if (dto.status === OrderStatus.CONFIRMED && !existing.confirmedAt) {
      timestampUpdates.confirmedAt = now;
    } else if (dto.status === OrderStatus.SHIPPED && !existing.shippedAt) {
      timestampUpdates.shippedAt = now;
    } else if (dto.status === OrderStatus.DELIVERED && !existing.deliveredAt) {
      timestampUpdates.deliveredAt = now;
    } else if (dto.status === OrderStatus.CANCELLED) {
      timestampUpdates.cancelledAt = now;
      timestampUpdates.cancellationReason = dto.cancellationReason || 'Cancelled by administrator';
    }

    if (dto.notes) {
      timestampUpdates.adminNotes = dto.notes;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: dto.status,
          ...timestampUpdates,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: existing.status,
          toStatus: dto.status,
          notes: dto.notes || dto.cancellationReason || null,
          actorId: admin.id,
          actorName: admin.username,
        },
      });

      // If cancelled, replenish inventory reserved / stock
      if (dto.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
        for (const item of existing.items) {
          if (item.productId) {
            const inv = await tx.inventoryItem.findUnique({
              where: { productId: item.productId },
            });
            if (inv) {
              const prev = inv.stockQuantity;
              const next = prev + item.quantity;
              await tx.inventoryItem.update({
                where: { id: inv.id },
                data: { stockQuantity: next },
              });
              await tx.inventoryLog.create({
                data: {
                  inventoryItemId: inv.id,
                  changeType: 'ORDER_CANCELLED',
                  quantityChange: item.quantity,
                  previousQuantity: prev,
                  newQuantity: next,
                  reason: `Order ${existing.orderNumber} cancelled by admin`,
                  actorId: admin.id,
                },
              });
            }
          }
        }
      }
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'ORDER_STATUS_UPDATED',
      targetType: 'Order',
      targetId: id,
      details: {
        orderNumber: existing.orderNumber,
        fromStatus: existing.status,
        toStatus: dto.status,
        notes: dto.notes,
        cancellationReason: dto.cancellationReason,
      },
    });

    return this.getOrderDetails(id);
  }
}
