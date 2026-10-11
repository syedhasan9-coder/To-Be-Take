import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, PrismaService, ShippingStatus } from '@tobetake/database';
import { PaginatedResult, ShipmentListItem } from '@tobetake/shared-types';
import { UpdateSellerShipmentDto } from '../dto/update-seller-shipment.dto';
import { CourierRegistryService } from '../../shipping/services/courier-registry.service';

@Injectable()
export class SellerShippingService {
  private readonly logger = new Logger(SellerShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courierRegistry: CourierRegistryService,
  ) {}

  private formatShipment(s: any): ShipmentListItem {
    let meta: Record<string, any> = {};
    let cleanNotes: string | null = s.notes;

    if (s.notes) {
      try {
        const parsed = JSON.parse(s.notes);
        if (typeof parsed === 'object' && parsed !== null) {
          meta = parsed;
          cleanNotes = parsed.notes || parsed.remarks || null;
        }
      } catch {
        // Plain text note
      }
    }

    return {
      id: s.id,
      orderId: s.orderId,
      orderNumber: s.order?.orderNumber,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      trackingUrl: s.trackingUrl,
      status: s.status,
      estimatedDelivery: s.estimatedDelivery,
      shippedDate: s.shippedDate,
      deliveredDate: s.deliveredDate,
      shippedAt: s.shippedDate,
      deliveredAt: s.deliveredDate,
      notes: cleanNotes,
      weightKg: meta.weightKg !== undefined ? Number(meta.weightKg) : null,
      pieces: meta.pieces !== undefined ? Number(meta.pieces) : null,
      shippingCharges: meta.shippingCharges !== undefined ? Number(meta.shippingCharges) : null,
      codAmount: meta.codAmount !== undefined ? Number(meta.codAmount) : null,
      bookingMode: meta.bookingMode || null,
      recipientName: meta.recipientName || null,
      destinationCity: meta.destinationCity || null,
      metadata: Object.keys(meta).length > 0 ? meta : null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

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

    return {
      items: shipments.map((s) => this.formatShipment(s)),
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
      weightKg?: number;
      pieces?: number;
      shippingCharges?: number;
      codAmount?: number;
      notes?: string;
    },
  ): Promise<ShipmentListItem> {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: {
          where: { sellerId },
        },
        customer: true,
      },
    });

    if (!order || order.items.length === 0) {
      throw new NotFoundException(
        'Order not found or does not contain items from your store.',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot book a shipment for a cancelled order.');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order is already delivered.');
    }

    // Prevent duplicate booking for this order by this seller
    const existingShipment = await this.prisma.shipment.findFirst({
      where: {
        orderId: data.orderId,
        status: { notIn: [ShippingStatus.FAILED] },
        notes: { contains: sellerId },
      },
    });

    if (existingShipment) {
      throw new BadRequestException(
        `A shipment has already been booked for this order with tracking '${existingShipment.trackingNumber}'.`,
      );
    }

    const recipientName =
      `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
      'Customer';

    // Validate and book via CourierRegistry
    const bookingResult = await this.courierRegistry.bookShipment(data.carrier, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientName,
      recipientPhone: '',
      destinationAddress: order.shippingAddress || 'Address on file',
      destinationCity: 'Pakistan',
      weightKg: data.weightKg || 0.5,
      pieces: data.pieces || 1,
      codAmount: data.codAmount || 0,
      shippingCharges: data.shippingCharges || 0,
      trackingNumber: data.trackingNumber,
      notes: data.notes,
    });

    const now = new Date();
    const notesPayload = JSON.stringify({
      sellerId,
      bookingMode: bookingResult.bookingMode,
      carrierCode: bookingResult.carrierCode,
      weightKg: data.weightKg || 0.5,
      pieces: data.pieces || 1,
      shippingCharges: data.shippingCharges || 0,
      codAmount: data.codAmount || 0,
      bookedAt: now.toISOString(),
      notes: data.notes || null,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const ship = await tx.shipment.create({
        data: {
          orderId: data.orderId,
          carrier: bookingResult.carrier,
          trackingNumber: bookingResult.trackingNumber,
          trackingUrl: bookingResult.trackingUrl || data.trackingUrl || null,
          status: ShippingStatus.LABEL_CREATED,
          estimatedDelivery: data.estimatedDelivery
            ? new Date(data.estimatedDelivery)
            : null,
          notes: notesPayload,
        },
        include: {
          order: true,
        },
      });

      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PENDING) {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: OrderStatus.PROCESSING },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: data.orderId,
            fromStatus: order.status,
            toStatus: OrderStatus.PROCESSING,
            notes: `Seller dispatched package via ${bookingResult.carrier} (Tracking: ${bookingResult.trackingNumber})`,
            actorId: sellerId,
            actorName: 'Seller',
          },
        });
      }

      return ship;
    });

    return this.formatShipment(created);
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
    if (dto.notes !== undefined) {
      let existingMeta = {};
      try {
        existingMeta = JSON.parse(shipment.notes || '{}');
      } catch {
        existingMeta = {};
      }
      updateData.notes = JSON.stringify({
        ...existingMeta,
        notes: dto.notes,
        updatedAt: new Date().toISOString(),
      });
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: { order: true },
    });

    return this.formatShipment(updated);
  }
}
