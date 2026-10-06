import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, ProductStatus } from '@tobetake/database';
import { PaginatedResult, ProductListItem } from '@tobetake/shared-types';
import { CreateSellerProductDto } from '../dto/create-seller-product.dto';
import { UpdateSellerProductDto } from '../dto/update-seller-product.dto';

@Injectable()
export class SellerProductsService {
  private readonly logger = new Logger(SellerProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCategories(): Promise<
    Array<{ id: number; name: string; slug: string; description: string | null }>
  > {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
    return categories;
  }

  async getProducts(
    sellerId: string,
    query: {
      search?: string;
      categoryId?: number;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<ProductListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      sellerId,
      isDeleted: false,
    };

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }

    if (query.status) {
      where.status = query.status as ProductStatus;
    }

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: ProductListItem[] = items.map((p) => ({
      id: p.id,
      sellerId: p.sellerId,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      name: p.name,
      title: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      status: p.status,
      images: p.images,
      stockQuantity: p.inventory?.stockQuantity ?? 0,
      inventory: p.inventory
        ? {
            stockQuantity: p.inventory.stockQuantity,
            currentStock: p.inventory.stockQuantity,
            reservedQuantity: p.inventory.reservedQuantity,
            reservedStock: p.inventory.reservedQuantity,
            availableQuantity: Math.max(
              0,
              p.inventory.stockQuantity - p.inventory.reservedQuantity,
            ),
            availableStock: Math.max(
              0,
              p.inventory.stockQuantity - p.inventory.reservedQuantity,
            ),
            lowStockThreshold: p.inventory.lowStockThreshold,
            isLowStock:
              p.inventory.stockQuantity <= p.inventory.lowStockThreshold,
            isOutOfStock: p.inventory.stockQuantity === 0,
            location: p.inventory.location,
          }
        : undefined,
      isDeleted: p.isDeleted,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(
    sellerId: string,
    productId: string,
  ): Promise<ProductListItem> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        isDeleted: false,
      },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID '${productId}' not found in your store catalog.`,
      );
    }

    return {
      id: product.id,
      sellerId: product.sellerId,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? null,
      name: product.name,
      title: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      status: product.status,
      images: product.images,
      stockQuantity: product.inventory?.stockQuantity ?? 0,
      inventory: product.inventory
        ? {
            stockQuantity: product.inventory.stockQuantity,
            currentStock: product.inventory.stockQuantity,
            reservedQuantity: product.inventory.reservedQuantity,
            reservedStock: product.inventory.reservedQuantity,
            availableQuantity: Math.max(
              0,
              product.inventory.stockQuantity -
                product.inventory.reservedQuantity,
            ),
            availableStock: Math.max(
              0,
              product.inventory.stockQuantity -
                product.inventory.reservedQuantity,
            ),
            lowStockThreshold: product.inventory.lowStockThreshold,
            isLowStock:
              product.inventory.stockQuantity <=
              product.inventory.lowStockThreshold,
            isOutOfStock: product.inventory.stockQuantity === 0,
            location: product.inventory.location,
          }
        : undefined,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async createProduct(
    sellerId: string,
    dto: CreateSellerProductDto,
  ): Promise<ProductListItem> {
    this.logger.log(`Creating product for seller ${sellerId}: SKU='${dto.sku}'`);

    // 1. Verify unique SKU
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`SKU '${dto.sku}' is already in use.`);
    }

    // 2. Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Selected category does not exist.');
      }
    }

    // 3. Generate slug
    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // 4. Create product and inventory transactionally
    const initialStock = Number(dto.stockQuantity) || 0;
    const lowStockThreshold = Number(dto.lowStockThreshold) || 5;

    const newProduct = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sellerId, // Forced server-side from auth user!
          name: dto.name,
          slug,
          sku: dto.sku,
          description: dto.description ?? null,
          price: new Prisma.Decimal(dto.price),
          compareAtPrice: dto.compareAtPrice
            ? new Prisma.Decimal(dto.compareAtPrice)
            : null,
          costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
          categoryId: dto.categoryId ?? null,
          status: ProductStatus.ACTIVE,
          images: dto.images ?? [],
        },
      });

      const inv = await tx.inventoryItem.create({
        data: {
          productId: created.id,
          sku: created.sku,
          stockQuantity: initialStock,
          reservedQuantity: 0,
          lowStockThreshold,
          location: dto.location ?? 'Main Warehouse',
        },
      });

      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inv.id,
            changeType: 'INITIAL_STOCK',
            quantityChange: initialStock,
            previousQuantity: 0,
            newQuantity: initialStock,
            reason: 'Initial product stock allocation',
            actorId: sellerId,
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: { category: true, inventory: true },
      });
    });

    return this.getProductById(sellerId, newProduct.id);
  }

  async updateProduct(
    sellerId: string,
    productId: string,
    dto: UpdateSellerProductDto,
  ): Promise<ProductListItem> {
    // 1. Ownership check
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, sellerId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Product not found in your catalog.');
    }

    // 2. Check SKU uniqueness if changed
    if (dto.sku && dto.sku !== existing.sku) {
      const duplicate = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (duplicate) {
        throw new ConflictException(`SKU '${dto.sku}' is already in use.`);
      }
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = new Prisma.Decimal(dto.price);
    if (dto.compareAtPrice !== undefined) {
      updateData.compareAtPrice = dto.compareAtPrice
        ? new Prisma.Decimal(dto.compareAtPrice)
        : null;
    }
    if (dto.costPrice !== undefined) {
      updateData.costPrice = dto.costPrice
        ? new Prisma.Decimal(dto.costPrice)
        : null;
    }
    if (dto.categoryId !== undefined) {
      updateData.category = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.images !== undefined) updateData.images = dto.images;

    await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return this.getProductById(sellerId, productId);
  }

  async updateProductStatus(
    sellerId: string,
    productId: string,
    status: ProductStatus,
  ): Promise<ProductListItem> {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, sellerId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Product not found in your catalog.');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    return this.getProductById(sellerId, productId);
  }

  async deleteProduct(
    sellerId: string,
    productId: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, sellerId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Product not found in your catalog.');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: ProductStatus.INACTIVE,
      },
    });

    return {
      success: true,
      message: `Product '${existing.name}' was removed from your catalog.`,
    };
  }
}
