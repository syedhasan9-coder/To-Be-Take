import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, ProductStatus } from '@tobetake/database';
import {
  CustomerProductQueryParams,
  CustomerProductDetail,
  CustomerStorefrontProduct,
  CustomerReviewItem,
} from '@tobetake/shared-types';

@Injectable()
export class CustomerProductsService {
  private readonly logger = new Logger(CustomerProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapProductSummary(p: any): CustomerStorefrontProduct {
    const rawImages = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
    const images = rawImages.map(String);
    const price = Number(p.price) || 0;
    const compareAtPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
    const discountPercent = compareAtPrice && compareAtPrice > price 
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
      : undefined;

    const reviews = p.reviews || [];
    const ratingCount = reviews.length;
    const ratingAvg = ratingCount > 0
      ? Number((reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / ratingCount).toFixed(1))
      : 0;

    const stock = p.inventory ? Number(p.inventory.stockQuantity) : 0;

    return {
      id: p.id,
      name: p.name,
      title: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description || '',
      price,
      compareAtPrice,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      status: p.status,
      moderationNotes: p.moderationNotes ?? null,
      images,
      isDeleted: p.isDeleted ?? false,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      categoryId: p.categoryId ?? null,
      categoryName: p.category?.name ?? null,
      sellerId: p.sellerId,
      sellerName: p.seller ? `${p.seller.firstName} ${p.seller.lastName}` : undefined,
      storeName: p.seller?.storeName || (p.seller ? `${p.seller.firstName} ${p.seller.lastName}` : null),
      sellerUsername: p.seller?.username,
      sellerEmail: p.seller?.email,
      rating: ratingAvg,
      reviewCount: ratingCount,
      stockQuantity: stock,
      inStock: stock > 0,
      isFeatured: true,
      isNew: true,
      isBestSeller: ratingCount > 2,
      discountPercent,
    };
  }

  async findProducts(query: CustomerProductQueryParams) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProductStatus.ACTIVE,
      isDeleted: false,
    };

    if (query.search && query.search.trim().length > 0) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Category Resolution (supporting IDs, slugs, parent->child hierarchy & common aliases)
    if (query.categoryId) {
      const targetCatId = Number(query.categoryId);
      const childCategories = await this.prisma.category.findMany({
        where: { parentId: targetCatId, isActive: true },
        select: { id: true },
      });
      const catIds = [targetCatId, ...childCategories.map((c) => c.id)];
      where.categoryId = { in: catIds };
    } else if (query.categorySlug || query.category) {
      const rawCat = String(query.categorySlug || query.category).trim().toLowerCase();
      if (rawCat && rawCat !== 'all' && rawCat !== 'all-categories') {
        const aliasMap: Record<string, string> = {
          'beauty': 'beauty-wellness',
          'skincare': 'botanical-skincare',
          'botanical': 'botanical-skincare',
          'oils': 'aromatherapy-oils',
          'essential-oils': 'aromatherapy-oils',
          'pottery': 'ceramics-tableware',
          'ceramics': 'ceramics-tableware',
          'home': 'home-living',
          'lifestyle': 'home-living',
          'living': 'home-living',
          'furniture': 'home-living',
          'electronics': 'electronics-gadgets',
          'gadgets': 'electronics-gadgets',
          'tech': 'electronics-gadgets',
          'audio': 'audio-headphones',
          'headphones': 'audio-headphones',
          'smart': 'smart-devices-wearables',
          'wearables': 'smart-devices-wearables',
          'food': 'grocery-food',
          'grocery': 'grocery-food',
        };
        const searchSlug = aliasMap[rawCat] || rawCat;

        const matchedCategory = await this.prisma.category.findFirst({
          where: {
            OR: [
              { slug: searchSlug },
              { slug: { contains: searchSlug, mode: 'insensitive' } },
              { name: { contains: searchSlug, mode: 'insensitive' } },
            ],
            isActive: true,
          },
        });

        if (matchedCategory) {
          const childCategories = await this.prisma.category.findMany({
            where: { parentId: matchedCategory.id, isActive: true },
            select: { id: true },
          });
          const catIds = [matchedCategory.id, ...childCategories.map((c) => c.id)];
          where.categoryId = { in: catIds };
        } else {
          where.categoryId = -999999;
        }
      }
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.inStock === true || String(query.inStock) === 'true') {
      where.inventory = { stockQuantity: { gt: 0 } };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = Number(query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = Number(query.maxPrice);
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (query.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products, allCategories] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: true,
          reviews: true,
          inventory: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: { where: { status: ProductStatus.ACTIVE, isDeleted: false } } },
          },
        },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    // Aggregate category counts for parent categories
    const catCountMap = new Map<number, number>();
    for (const cat of allCategories) {
      catCountMap.set(cat.id, cat._count.products);
    }
    for (const cat of allCategories) {
      if (cat.parentId && catCountMap.has(cat.parentId)) {
        catCountMap.set(cat.parentId, (catCountMap.get(cat.parentId) || 0) + cat._count.products);
      }
    }

    const mappedProducts = products.map((p) => this.mapProductSummary(p));

    return {
      products: mappedProducts,
      items: mappedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      availableCategories: allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId,
        count: catCountMap.get(c.id) ?? c._count.products,
      })),
    };
  }

  async getProductByIdOrSlug(idOrSlug: string): Promise<CustomerProductDetail> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          ...(isUUID ? [{ id: idOrSlug }] : []),
          { slug: idOrSlug },
        ],
        isDeleted: false,
      },
      include: {
        category: true,
        seller: {
          include: {
            sellerProducts: {
              where: { status: ProductStatus.ACTIVE },
              include: {
                category: true,
                inventory: true,
                reviews: true,
              },
              take: 4,
            },
          },
        },
        reviews: {
          include: {
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${idOrSlug}' not found.`);
    }

    const summary = this.mapProductSummary(product);

    // Map reviews
    const mappedReviews: CustomerReviewItem[] = product.reviews.map((r) => ({
      id: r.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: summary.images[0],
      customerId: r.customerId,
      customerName: r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'Verified Customer',
      rating: Number(r.rating),
      title: r.title ?? null,
      comment: r.comment || '',
      isVerifiedPurchase: true,
      createdAt: r.createdAt.toISOString(),
    }));

    // Related products
    const relatedDbProducts = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: ProductStatus.ACTIVE,
        isDeleted: false,
      },
      include: {
        category: true,
        seller: true,
        reviews: true,
        inventory: true,
      },
      take: 4,
    });

    const relatedProducts = relatedDbProducts.map((p) => this.mapProductSummary(p));

    const stock = product.inventory ? Number(product.inventory.stockQuantity) : 0;
    const reserved = product.inventory ? Number(product.inventory.reservedQuantity) : 0;
    const lowStockThreshold = product.inventory ? Number(product.inventory.lowStockThreshold) : 5;

    const allSellerReviews = (product.seller.sellerProducts || []).flatMap((p: any) => p.reviews || []);
    const sellerRating = allSellerReviews.length > 0
      ? Number((allSellerReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / allSellerReviews.length).toFixed(1))
      : 5.0;

    return {
      ...summary,
      inventory: {
        stockQuantity: stock,
        currentStock: stock,
        reservedQuantity: reserved,
        reservedStock: reserved,
        availableQuantity: Math.max(0, stock - reserved),
        availableStock: Math.max(0, stock - reserved),
        lowStockThreshold,
        isLowStock: stock <= lowStockThreshold,
        isOutOfStock: stock <= 0,
        location: product.inventory?.location ?? null,
      },
      seller: {
        id: product.seller.id,
        storeName: product.seller.storeName || `${product.seller.firstName} ${product.seller.lastName}`,
        ownerName: `${product.seller.firstName} ${product.seller.lastName}`,
        city: 'Pakistan',
        rating: sellerRating,
        joinedDate: product.seller.createdAt.toISOString(),
      },
      specifications: {
        'Origin': 'Pakistan',
        'Material / Craftsmanship': 'Authentic Handcrafted / Certified Pakistani Heritage',
        'SKU Code': product.sku,
        'Guarantee': '7-Day ToBeTake Buyer Protection',
        'Courier Service': 'TCS Express / Leopards Courier (2-3 business days)',
      },
      deliveryInfo: {
        standardEstimatedDays: '2 - 3 business days',
        expressEstimatedDays: '1 - 2 business days',
        couriers: ['TCS Express', 'Leopards Courier Service', 'Trax Logistics'],
        freeDeliveryThreshold: 3000,
        returnDays: 7,
      },
      reviews: mappedReviews,
      relatedProducts,
    };
  }
}
