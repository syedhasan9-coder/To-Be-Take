import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, ShippingStatus } from '@tobetake/database';
import { PaginatedResult, ShipmentListItem } from '@tobetake/shared-types';
import { UpdateSellerShipmentDto } from '../dto/update-seller-shipment.dto';

@Injectable()
export class SellerShippingService {
  private readonly logger = new Logger(SellerShippingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getShipments(
    sellerId: string,
    query: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<ShipmentListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {
      order: {
        items: {
          some: {
            sellerId,
          },
        },
      },
    };

    if (query.status) {
      where.status = query.status as ShippingStatus;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { trackingNumber: { contains: searchTerm, mode: 'insensitive' } },
        { carrier: { contains: searchTerm, mode: 'insensitive' } },
        { order: { orderNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: ShipmentListItem[] = shipments.map((s) => ({
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
      shippedAt: s.shippedDate,
      deliveredAt: s.deliveredDate,
      notes: s.notes,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createShipment(
    sellerId: string,
    data: {
      orderId: string;
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
      notes?: string;
    },
  ): Promise<ShipmentListItem> {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: {
          where: { sellerId },
        },
      },
    });

    if (!order || order.items.length === 0) {
      throw new NotFoundException(
        'Order not found or does not contain items from your store.',
      );
    }

    const created = await this.prisma.shipment.create({
      data: {
        orderId: data.orderId,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl ?? null,
        status: ShippingStatus.LABEL_CREATED,
        estimatedDelivery: data.estimatedDelivery
          ? new Date(data.estimatedDelivery)
          : null,
        notes: data.notes ?? null,
      },
      include: {
        order: true,
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

  async updateShipment(
    sellerId: string,
    shipmentId: string,
    dto: UpdateSellerShipmentDto,
  ): Promise<ShipmentListItem> {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        order: {
          items: {
            some: { sellerId },
          },
        },
      },
      include: { order: true },
    });

    if (!shipment) {
      throw new NotFoundException(
        'Shipment not found or does not belong to your store orders.',
      );
    }

    const updateData: Prisma.ShipmentUpdateInput = {};
    if (dto.carrier !== undefined) updateData.carrier = dto.carrier;
    if (dto.trackingNumber !== undefined)
      updateData.trackingNumber = dto.trackingNumber;
    if (dto.trackingUrl !== undefined) updateData.trackingUrl = dto.trackingUrl;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === ShippingStatus.IN_TRANSIT && !shipment.shippedDate) {
        updateData.shippedDate = new Date();
      }
      if (dto.status === ShippingStatus.DELIVERED && !shipment.deliveredDate) {
        updateData.deliveredDate = new Date();
      }
    }
    if (dto.estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = dto.estimatedDelivery
        ? new Date(dto.estimatedDelivery)
        : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: { order: true },
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
