import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { InventoryItemDto, PaginatedResult } from '@tobetake/shared-types';
import { AdjustSellerInventoryDto } from '../dto/adjust-seller-inventory.dto';

@Injectable()
export class SellerInventoryService {
  private readonly logger = new Logger(SellerInventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getInventory(
    sellerId: string,
    query: {
      search?: string;
      lowStockOnly?: boolean;
      outOfStockOnly?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<InventoryItemDto>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = {
      product: {
        sellerId,
        isDeleted: false,
      },
    };

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { product: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (query.outOfStockOnly) {
      where.stockQuantity = 0;
    }

    const [total, items] = await Promise.all([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    let formattedItems: InventoryItemDto[] = items.map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      productName: inv.product.name,
      productTitle: inv.product.name,
      sku: inv.sku,
      categoryId: inv.product.categoryId,
      categoryName: inv.product.category?.name ?? null,
      sellerId: inv.product.sellerId,
      stockQuantity: inv.stockQuantity,
      currentStock: inv.stockQuantity,
      reservedQuantity: inv.reservedQuantity,
      reservedStock: inv.reservedQuantity,
      availableQuantity: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
      availableStock: Math.max(0, inv.stockQuantity - inv.reservedQuantity),
      lowStockThreshold: inv.lowStockThreshold,
      isLowStock: inv.stockQuantity <= inv.lowStockThreshold,
      isOutOfStock: inv.stockQuantity === 0,
      status: inv.stockQuantity === 0 ? 'OUT_OF_STOCK' : inv.stockQuantity <= inv.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
      location: inv.location,
      updatedAt: inv.updatedAt,
    }));

    if (query.lowStockOnly) {
      formattedItems = formattedItems.filter((i) => i.isLowStock);
    }

    return {
      items: formattedItems,
      total: query.lowStockOnly ? formattedItems.length : total,
      page,
      limit,
      totalPages: Math.ceil(
        (query.lowStockOnly ? formattedItems.length : total) / limit,
      ),
    };
  }

  async adjustStock(
    sellerId: string,
    productId: string,
    dto: AdjustSellerInventoryDto,
  ): Promise<InventoryItemDto> {
    this.logger.log(
      `Adjusting inventory for seller ${sellerId}, productId: ${productId}`,
    );

    // 1. Verify product ownership
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId, isDeleted: false },
      include: { inventory: true, category: true },
    });

    if (!product || !product.inventory) {
      throw new NotFoundException(
        'Inventory record not found in your seller catalog.',
      );
    }

    if (dto.stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative.');
    }

    const previousQuantity = product.inventory.stockQuantity;
    const newQuantity = dto.stockQuantity;
    const quantityChange = newQuantity - previousQuantity;
    const changeType = dto.changeType ?? (quantityChange >= 0 ? 'RESTOCK' : 'ADJUSTMENT');

    const updated = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventoryItem.update({
        where: { id: product.inventory!.id },
        data: {
          stockQuantity: newQuantity,
          lowStockThreshold:
            dto.lowStockThreshold !== undefined
              ? dto.lowStockThreshold
              : product.inventory!.lowStockThreshold,
          location: dto.location !== undefined ? dto.location : product.inventory!.location,
        },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: inv.id,
          changeType,
          quantityChange,
          previousQuantity,
          newQuantity,
          reason: dto.reason ?? 'Seller inventory adjustment',
          actorId: sellerId,
        },
      });

      return inv;
    });

    return {
      id: updated.id,
      productId: product.id,
      productName: product.name,
      productTitle: product.name,
      sku: updated.sku,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? null,
      sellerId: product.sellerId,
      stockQuantity: updated.stockQuantity,
      currentStock: updated.stockQuantity,
      reservedQuantity: updated.reservedQuantity,
      reservedStock: updated.reservedQuantity,
      availableQuantity: Math.max(0, updated.stockQuantity - updated.reservedQuantity),
      availableStock: Math.max(0, updated.stockQuantity - updated.reservedQuantity),
      lowStockThreshold: updated.lowStockThreshold,
      isLowStock: updated.stockQuantity <= updated.lowStockThreshold,
      isOutOfStock: updated.stockQuantity === 0,
      status: updated.stockQuantity === 0 ? 'OUT_OF_STOCK' : updated.stockQuantity <= updated.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
      location: updated.location,
      updatedAt: updated.updatedAt,
    };
  }
}
