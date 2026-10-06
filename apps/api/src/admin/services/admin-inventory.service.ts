import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import {
  InventoryItemDto,
  InventoryLogItem,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { InventoryQueryDto, UpdateStockDto } from '../dto/inventory.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminInventoryService {
  private readonly logger = new Logger(AdminInventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List inventory levels with low-stock / out-of-stock filters and seller/product details.
   */
  async listInventory(query: InventoryQueryDto): Promise<PaginatedResult<InventoryItemDto>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {
      product: {
        isDeleted: false,
      },
    };

    if (query.outOfStock) {
      where.stockQuantity = { lte: 0 };
    }

    if (query.sellerId) {
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        sellerId: query.sellerId,
      };
    }

    if (query.categoryId) {
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        categoryId: query.categoryId,
      };
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { sku: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } },
        { product: { name: { contains: s, mode: 'insensitive' } } },
        { product: { seller: { storeName: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { stockQuantity: 'asc' },
        include: {
          product: {
            include: {
              category: true,
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  storeName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    let formatted = items.map((item) => {
      const stock = item.stockQuantity;
      const reserved = item.reservedQuantity;
      const available = Math.max(0, stock - reserved);
      const isLowStock = stock > 0 && stock <= item.lowStockThreshold;
      const isOutOfStock = stock <= 0;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.sku,
        categoryId: item.product.categoryId,
        categoryName: item.product.category?.name || null,
        sellerId: item.product.sellerId,
        sellerName: `${item.product.seller.firstName} ${item.product.seller.lastName}`.trim(),
        storeName: item.product.seller.storeName,
        stockQuantity: stock,
        reservedQuantity: reserved,
        availableQuantity: available,
        lowStockThreshold: item.lowStockThreshold,
        isLowStock,
        isOutOfStock,
        location: item.location,
        updatedAt: item.updatedAt,
      };
    });

    if (query.lowStock) {
      formatted = formatted.filter((f) => f.isLowStock || f.isOutOfStock);
    }

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update stock quantity, threshold, or location and log history.
   */
  async updateStock(
    id: string,
    dto: UpdateStockDto,
    admin: AuthenticatedAdminUser,
  ): Promise<InventoryItemDto> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
            seller: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID '${id}' was not found`);
    }

    const previousQuantity = item.stockQuantity;
    const newQuantity = dto.stockQuantity;
    const quantityChange = newQuantity - previousQuantity;

    const updated = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventoryItem.update({
        where: { id },
        data: {
          stockQuantity: newQuantity,
          lowStockThreshold: dto.lowStockThreshold ?? item.lowStockThreshold,
          location: dto.location !== undefined ? dto.location : item.location,
        },
      });

      if (quantityChange !== 0) {
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: id,
            changeType: dto.changeType || (quantityChange > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT'),
            quantityChange,
            previousQuantity,
            newQuantity,
            reason: dto.reason || 'Admin stock level adjustment',
            actorId: admin.id,
          },
        });
      }

      return inv;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'INVENTORY_STOCK_UPDATED',
      targetType: 'InventoryItem',
      targetId: id,
      details: {
        sku: item.sku,
        productName: item.product.name,
        previousQuantity,
        newQuantity,
        quantityChange,
        reason: dto.reason,
      },
    });

    const stock = updated.stockQuantity;
    const reserved = updated.reservedQuantity;

    return {
      id: updated.id,
      productId: updated.productId,
      productName: item.product.name,
      sku: updated.sku,
      categoryId: item.product.categoryId,
      categoryName: item.product.category?.name || null,
      sellerId: item.product.sellerId,
      sellerName: `${item.product.seller.firstName} ${item.product.seller.lastName}`.trim(),
      storeName: item.product.seller.storeName,
      stockQuantity: stock,
      reservedQuantity: reserved,
      availableQuantity: Math.max(0, stock - reserved),
      lowStockThreshold: updated.lowStockThreshold,
      isLowStock: stock > 0 && stock <= updated.lowStockThreshold,
      isOutOfStock: stock <= 0,
      location: updated.location,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Get stock audit trail for an inventory item.
   */
  async getInventoryLogs(inventoryItemId: string): Promise<InventoryLogItem[]> {
    const logs = await this.prisma.inventoryLog.findMany({
      where: { inventoryItemId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((l) => ({
      id: l.id,
      inventoryItemId: l.inventoryItemId,
      changeType: l.changeType,
      quantityChange: l.quantityChange,
      previousQuantity: l.previousQuantity,
      newQuantity: l.newQuantity,
      reason: l.reason,
      actorId: l.actorId,
      createdAt: l.createdAt,
    }));
  }
}
