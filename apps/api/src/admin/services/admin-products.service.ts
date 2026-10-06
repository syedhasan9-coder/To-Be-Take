import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, ProductStatus } from '@tobetake/database';
import {
  PaginatedResult,
  ProductDetailItem,
  ProductListItem,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import {
  CreateProductDto,
  ModerateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '../dto/product.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminProductsService {
  private readonly logger = new Logger(AdminProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List products with pagination, search, status, category, and seller filtering.
   */
  async listProducts(query: ProductQueryDto): Promise<PaginatedResult<ProductListItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
        { seller: { firstName: { contains: s, mode: 'insensitive' } } },
        { seller: { lastName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (['name', 'price', 'sku', 'status', 'createdAt'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.ProductOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              storeName: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          inventory: true,
        },
      }),
    ]);

    return {
      items: products.map((p) => ({
        id: p.id,
        sellerId: p.sellerId,
        sellerUsername: p.seller.username,
        sellerName: `${p.seller.firstName} ${p.seller.lastName}`.trim(),
        storeName: p.seller.storeName,
        categoryId: p.categoryId,
        categoryName: p.category?.name || null,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPrice: p.costPrice ? Number(p.costPrice) : null,
        status: p.status,
        moderationNotes: p.moderationNotes,
        images: p.images,
        stockQuantity: p.inventory?.stockQuantity ?? 0,
        reservedQuantity: p.inventory?.reservedQuantity ?? 0,
        isDeleted: p.isDeleted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single product detail including inventory metrics.
   */
  async getProductDetails(id: string): Promise<ProductDetailItem> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            storeName: true,
          },
        },
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' was not found`);
    }

    const stock = product.inventory?.stockQuantity ?? 0;
    const reserved = product.inventory?.reservedQuantity ?? 0;

    return {
      id: product.id,
      sellerId: product.sellerId,
      sellerUsername: product.seller.username,
      sellerName: `${product.seller.firstName} ${product.seller.lastName}`.trim(),
      storeName: product.seller.storeName,
      categoryId: product.categoryId,
      categoryName: product.category?.name || null,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      status: product.status,
      moderationNotes: product.moderationNotes,
      images: product.images,
      stockQuantity: stock,
      reservedQuantity: reserved,
      availableQuantity: Math.max(0, stock - reserved),
      lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
      location: product.inventory?.location || null,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Create a product in catalog with associated inventory item.
   */
  async createProduct(
    dto: CreateProductDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ProductDetailItem> {
    const slug =
      dto.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException(`A product with SKU '${dto.sku}' already exists`);
    }

    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });
    if (!seller) {
      throw new BadRequestException(`Seller with ID '${dto.sellerId}' was not found`);
    }

    const initialStock = dto.stockQuantity ?? 0;
    const lowThreshold = dto.lowStockThreshold ?? 5;

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug: finalSlug,
          sku: dto.sku,
          description: dto.description || null,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice || null,
          costPrice: dto.costPrice || null,
          categoryId: dto.categoryId || null,
          sellerId: dto.sellerId,
          images: dto.images || [],
          status: ProductStatus.ACTIVE,
        },
      });

      const inventory = await tx.inventoryItem.create({
        data: {
          productId: product.id,
          sku: product.sku,
          stockQuantity: initialStock,
          reservedQuantity: 0,
          lowStockThreshold: lowThreshold,
          location: dto.location || null,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventory.id,
            changeType: 'INITIAL_STOCK',
            quantityChange: initialStock,
            previousQuantity: 0,
            newQuantity: initialStock,
            reason: 'Initial stock intake during product creation',
            actorId: admin.id,
          },
        });
      }

      return product;
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PRODUCT_CREATED',
      targetType: 'Product',
      targetId: created.id,
      details: {
        name: created.name,
        sku: created.sku,
        price: created.price,
        sellerId: created.sellerId,
      },
    });

    return this.getProductDetails(created.id);
  }

  /**
   * Update product properties and catalog data.
   */
  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ProductDetailItem> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' was not found`);
    }

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.compareAtPrice !== undefined) data.compareAtPrice = dto.compareAtPrice;
    if (dto.costPrice !== undefined) data.costPrice = dto.costPrice;
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.moderationNotes !== undefined) data.moderationNotes = dto.moderationNotes;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.isDeleted !== undefined) {
      data.isDeleted = dto.isDeleted;
      data.deletedAt = dto.isDeleted ? new Date() : null;
    }

    await this.prisma.product.update({
      where: { id },
      data,
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PRODUCT_UPDATED',
      targetType: 'Product',
      targetId: id,
      details: {
        updates: dto,
      },
    });

    return this.getProductDetails(id);
  }

  /**
   * Moderate product (approve, reject, activate, or deactivate).
   */
  async moderateProduct(
    id: string,
    dto: ModerateProductDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ProductDetailItem> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' was not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        status: dto.status,
        moderationNotes: dto.moderationNotes || null,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PRODUCT_MODERATED',
      targetType: 'Product',
      targetId: id,
      details: {
        previousStatus: product.status,
        newStatus: dto.status,
        notes: dto.moderationNotes,
      },
    });

    return this.getProductDetails(id);
  }

  /**
   * Soft-delete a product.
   */
  async deleteProduct(id: string, admin: AuthenticatedAdminUser): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' was not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: ProductStatus.INACTIVE,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'PRODUCT_DELETED',
      targetType: 'Product',
      targetId: id,
      details: {
        name: product.name,
        sku: product.sku,
      },
    });
  }
}
