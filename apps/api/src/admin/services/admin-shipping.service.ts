import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, PrismaService, ShippingStatus } from '@tobetake/database';
import {
  CodSettlementInput,
  CodSettlementResult,
  CodSummaryInfo,
  CourierProviderInfo,
  PaginatedResult,
  ShipmentListItem,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { CreateShipmentDto, ShippingQueryDto, UpdateShipmentDto } from '../dto/shipping.dto';
import { AdminAuditService } from './admin-audit.service';
import { CourierRegistryService } from '../../shipping/services/courier-registry.service';
import { CodSettlementService } from '../../shipping/services/cod-settlement.service';

@Injectable()
export class AdminShippingService {
  private readonly logger = new Logger(AdminShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly courierRegistry: CourierRegistryService,
    private readonly codSettlementService: CodSettlementService,
  ) {}

  /**
   * Helper to format a Prisma Shipment record into a rich ShipmentListItem.
   */
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

  /**
   * Return available courier providers and their credential configuration state.
   */
  getAvailableProviders(): CourierProviderInfo[] {
    return this.courierRegistry.getAvailableProviders();
  }

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
      items: shipments.map((s) => this.formatShipment(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Create shipment record for an order with genuine booking validation.
   */
  async createShipment(
    dto: CreateShipmentDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ShipmentListItem> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { customer: true, payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' was not found`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot book a shipment for a cancelled order');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order is already marked delivered');
    }

    const shippingAddress =
      dto.destinationAddress ||
      order.shippingAddress ||
      '';

    if (!shippingAddress.trim()) {
      throw new BadRequestException('A valid shipping address is required before booking a courier shipment');
    }

    // Prevent duplicate active booking
    const activeShipment = await this.prisma.shipment.findFirst({
      where: {
        orderId: dto.orderId,
        status: { notIn: [ShippingStatus.FAILED] },
      },
    });

    if (activeShipment) {
      throw new BadRequestException(
        `Order ${order.orderNumber} already has an active shipment (Carrier: ${activeShipment.carrier}, Tracking: ${activeShipment.trackingNumber}). Cannot create duplicate booking.`,
      );
    }

    // Calculate server-verified COD requirement
    const codSummary = await this.codSettlementService.calculateCodDetails(dto.orderId);
    let resolvedCodAmount = 0;
    if (codSummary.isCodOrder) {
      resolvedCodAmount =
        dto.codAmount !== undefined ? Number(dto.codAmount) : codSummary.expectedCodAmount;
    }

    const recipientName =
      dto.recipientName ||
      `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
      'Customer';

    const recipientPhone = dto.recipientPhone || '';
    const destinationCity = dto.destinationCity || 'Pakistan';

    // Execute courier booking through registered provider
    const bookingResult = await this.courierRegistry.bookShipment(dto.carrier, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientName,
      recipientPhone,
      destinationAddress: shippingAddress,
      destinationCity,
      weightKg: dto.weightKg || 0.5,
      pieces: dto.pieces || 1,
      codAmount: resolvedCodAmount,
      shippingCharges: dto.shippingCharges || 0,
      trackingNumber: dto.trackingNumber,
      notes: dto.notes,
    });

    const now = new Date();
    const notesPayload = JSON.stringify({
      bookingMode: bookingResult.bookingMode,
      carrierCode: bookingResult.carrierCode,
      weightKg: dto.weightKg || 0.5,
      pieces: dto.pieces || 1,
      shippingCharges: dto.shippingCharges || 0,
      codAmount: resolvedCodAmount,
      recipientName,
      recipientPhone,
      destinationCity,
      destinationAddress: shippingAddress,
      bookedBy: admin.id,
      bookedByName: admin.username,
      bookedAt: now.toISOString(),
      notes: dto.notes || null,
      rawResponse: bookingResult.rawResponse || null,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: dto.orderId,
          carrier: bookingResult.carrier,
          trackingNumber: bookingResult.trackingNumber,
          trackingUrl: bookingResult.trackingUrl || dto.trackingUrl || null,
          estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
          shippedDate: now,
          status: ShippingStatus.IN_TRANSIT,
          notes: notesPayload,
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
            notes: `Dispatched with ${bookingResult.carrier} (Tracking: ${bookingResult.trackingNumber}, Mode: ${bookingResult.bookingMode})`,
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
        carrier: bookingResult.carrier,
        trackingNumber: bookingResult.trackingNumber,
        bookingMode: bookingResult.bookingMode,
        codAmount: resolvedCodAmount,
      },
    });

    return this.formatShipment(created);
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

    if (dto.notes !== undefined) {
      // Preserve existing metadata JSON if present
      let existingMeta = {};
      try {
        existingMeta = JSON.parse(existing.notes || '{}');
      } catch {
        existingMeta = {};
      }
      data.notes = JSON.stringify({
        ...existingMeta,
        notes: dto.notes,
        updatedAt: new Date().toISOString(),
      });
    }

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

    return this.formatShipment(updated);
  }

  /**
   * Get calculated COD details for an order.
   */
  async getCodDetails(orderId: string): Promise<CodSummaryInfo> {
    return this.codSettlementService.calculateCodDetails(orderId);
  }

  /**
   * Record courier COD remittance settlement with reconciliation verification.
   */
  async recordCodSettlement(
    orderId: string,
    dto: CodSettlementInput,
    admin: AuthenticatedAdminUser,
  ): Promise<CodSettlementResult> {
    return this.codSettlementService.recordRemittance(orderId, dto, admin);
  }
}
