import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, PrismaService, ShippingStatus } from '@tobetake/database';
import { PaginatedResult, ShipmentListItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { CreateShipmentDto, ShippingQueryDto, UpdateShipmentDto } from '../dto/shipping.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminShippingService {
  private readonly logger = new Logger(AdminShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List shipments with carrier, tracking, and status filtering.
   */
  async listShipments(query: ShippingQueryDto): Promise<PaginatedResult<ShipmentListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.carrier) {
      where.carrier = { contains: query.carrier, mode: 'insensitive' };
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { trackingNumber: { contains: s, mode: 'insensitive' } },
        { carrier: { contains: s, mode: 'insensitive' } },
        { order: { orderNumber: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
        },
      }),
    ]);

    return {
      items: shipments.map((s) => ({
        id: s.id,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create shipment record for an order and update order timeline.
   */
  async createShipment(
    dto: CreateShipmentDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ShipmentListItem> {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' was not found`);
    }

    const now = new Date();
    const created = await this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: dto.orderId,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          trackingUrl: dto.trackingUrl || null,
          estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
          shippedDate: now,
          status: ShippingStatus.IN_TRANSIT,
          notes: dto.notes || null,
        },
        include: {
          order: { select: { orderNumber: true } },
        },
      });

      if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
        await tx.order.update({
          where: { id: dto.orderId },
          data: {
            status: OrderStatus.SHIPPED,
            shippedAt: now,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: dto.orderId,
            fromStatus: order.status,
            toStatus: OrderStatus.SHIPPED,
            notes: `Dispatched with ${dto.carrier} (Tracking: ${dto.trackingNumber})`,
            actorId: admin.id,
            actorName: admin.username,
          },
        });
      }

      return shipment;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'SHIPMENT_CREATED',
      targetType: 'Shipment',
      targetId: created.id,
      details: {
        orderId: dto.orderId,
        orderNumber: order.orderNumber,
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
      },
    });

    return {
      id: created.id,
      orderId: created.orderId,
      orderNumber: created.order.orderNumber,
      carrier: created.carrier,
      trackingNumber: created.trackingNumber,
      trackingUrl: created.trackingUrl,
      status: created.status,
      estimatedDelivery: created.estimatedDelivery,
      shippedDate: created.shippedDate,
      deliveredDate: created.deliveredDate,
      notes: created.notes,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update shipment tracking or delivery status.
   */
  async updateShipment(
    id: string,
    dto: UpdateShipmentDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ShipmentListItem> {
    const existing = await this.prisma.shipment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existing) {
      throw new NotFoundException(`Shipment with ID '${id}' was not found`);
    }

    const data: Prisma.ShipmentUpdateInput = {};
    if (dto.carrier !== undefined) data.carrier = dto.carrier;
    if (dto.trackingNumber !== undefined) data.trackingNumber = dto.trackingNumber;
    if (dto.trackingUrl !== undefined) data.trackingUrl = dto.trackingUrl;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.estimatedDelivery !== undefined) {
      data.estimatedDelivery = dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null;
    }
    if (dto.shippedDate !== undefined) {
      data.shippedDate = dto.shippedDate ? new Date(dto.shippedDate) : null;
    }
    if (dto.deliveredDate !== undefined) {
      data.deliveredDate = dto.deliveredDate ? new Date(dto.deliveredDate) : null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes;

    const now = new Date();
    if (dto.status === ShippingStatus.DELIVERED && !data.deliveredDate) {
      data.deliveredDate = now;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const ship = await tx.shipment.update({
        where: { id },
        data,
        include: {
          order: { select: { orderNumber: true } },
        },
      });

      if (dto.status === ShippingStatus.DELIVERED && existing.order.status !== OrderStatus.DELIVERED) {
        await tx.order.update({
          where: { id: existing.orderId },
          data: {
            status: OrderStatus.DELIVERED,
            deliveredAt: now,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: existing.orderId,
            fromStatus: existing.order.status,
            toStatus: OrderStatus.DELIVERED,
            notes: `Delivered by ${ship.carrier} (Tracking: ${ship.trackingNumber})`,
            actorId: admin.id,
            actorName: admin.username,
          },
        });
      }

      return ship;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'SHIPMENT_UPDATED',
      targetType: 'Shipment',
      targetId: id,
      details: {
        orderNumber: existing.order.orderNumber,
        status: dto.status,
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
      },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      orderNumber: updated.order.orderNumber,
      carrier: updated.carrier,
      trackingNumber: updated.trackingNumber,
      trackingUrl: updated.trackingUrl,
      status: updated.status,
      estimatedDelivery: updated.estimatedDelivery,
      shippedDate: updated.shippedDate,
      deliveredDate: updated.deliveredDate,
      notes: updated.notes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
