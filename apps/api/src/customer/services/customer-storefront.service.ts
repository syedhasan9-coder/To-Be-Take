import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, ProductStatus, ApprovalStatus } from '@tobetake/database';
import {
  CustomerStorefrontData,
  CustomerStorefrontProduct,
  CategoryItem,
  CustomerFlashDeal,
  CustomerSellerSpotlight,
  CustomerHeroBanner,
} from '@tobetake/shared-types';

@Injectable()
export class CustomerStorefrontService {
  private readonly logger = new Logger(CustomerStorefrontService.name);

  constructor(private readonly prisma: PrismaService) {}

  mapProduct(p: any): CustomerStorefrontProduct {
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

  async getStorefrontData(): Promise<CustomerStorefrontData> {
    const [categories, allActiveProducts, approvedSellers] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: { where: { status: ProductStatus.ACTIVE } } },
          },
        },
        orderBy: { displayOrder: 'asc' },
        take: 12,
      }),
      this.prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE, isDeleted: false },
        include: {
          category: true,
          seller: true,
          reviews: { take: 5 },
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.sellerApproval.findMany({
        where: { status: ApprovalStatus.APPROVED },
        include: {
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
        },
        take: 6,
      }),
    ]);

    const mappedProducts = allActiveProducts.map((p) => this.mapProduct(p));

    const featuredProducts = mappedProducts.slice(0, 8);
    const newArrivals = [...mappedProducts].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);
    const bestSellers = mappedProducts.slice(4, 12);
    const topDeals = mappedProducts.filter((p) => (p.discountPercent ?? 0) > 0).slice(0, 8);

    const flashDealProducts = mappedProducts.slice(0, 4);
    const flashDeals: CustomerFlashDeal = {
      id: 'flash-deals-today',
      title: '⚡ Limited Flash Deals — Up to 35% Off',
      endsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      discountLabel: 'Save Up to 35% on Handcrafted Pottery & Swat Botanicals',
      products: flashDealProducts,
    };

    // Aggregate category counts for parent categories
    const catCountMap = new Map<number, number>();
    for (const cat of categories) {
      catCountMap.set(cat.id, cat._count.products);
    }
    for (const cat of categories) {
      if (cat.parentId && catCountMap.has(cat.parentId)) {
        catCountMap.set(cat.parentId, (catCountMap.get(cat.parentId) || 0) + cat._count.products);
      }
    }

    const mappedCategories: CategoryItem[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? undefined,
      parentId: c.parentId,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      productCount: catCountMap.get(c.id) ?? c._count.products,
      createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)) : new Date().toISOString(),
      updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt)) : new Date().toISOString(),
    }));

    const sellerSpotlights: CustomerSellerSpotlight[] = approvedSellers.map((appr) => {
      const s = appr.seller;
      const fProds = (s.sellerProducts || []).map((p) => this.mapProduct(p));
      const allSellerReviews = (s.sellerProducts || []).flatMap((p: any) => p.reviews || []);
      const sellerRatingAvg = allSellerReviews.length > 0
        ? Number((allSellerReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / allSellerReviews.length).toFixed(1))
        : 5.0;
      return {
        id: s.id,
        storeName: s.storeName || `${s.firstName} ${s.lastName}`,
        ownerName: `${s.firstName} ${s.lastName}`,
        businessCategory: s.businessCategory || 'Artisanal & Botanical Crafts',
        city: 'Lahore, Pakistan',
        productCount: s.sellerProducts?.length || 0,
        rating: sellerRatingAvg,
        joinedDate: s.createdAt.toISOString(),
        featuredProducts: fProds,
      };
    });

    const banners: CustomerHeroBanner[] = [
      {
        id: 'hero-1',
        tag: 'Spring Collection 2026',
        badge: 'Verified Pakistani Marketplace',
        title: 'Authentic Pakistani Artisanal & Botanical Heritage',
        subtitle: 'Handcrafted Multan Pottery, Pure Swat Botanicals & Modern Electronics with Nationwide Fast TCS Delivery.',
        ctaText: 'Explore Catalog',
        ctaLink: '/products',
        bgColor: '#1C3D2E',
      },
      {
        id: 'hero-2',
        tag: '100% Organic Certified',
        badge: 'Pure Natural Extracts',
        title: 'Pure Swat Botanical Skincare & Organic Oils',
        subtitle: '100% cold-pressed natural essences crafted sustainably in the pristine valleys of Swat & Hunza.',
        ctaText: 'Shop Botanical',
        ctaLink: '/products?categorySlug=botanical-skincare',
        bgColor: '#2E4C38',
      },
    ];

    return {
      heroBanners: banners,
      categories: mappedCategories,
      featuredProducts,
      newArrivals,
      bestSellers,
      flashDeals,
      sellerSpotlights,
      topDeals: topDeals.length > 0 ? topDeals : featuredProducts.slice(0, 4),
    };
  }

  async getCategories(): Promise<CategoryItem[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { status: ProductStatus.ACTIVE, isDeleted: false } } },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const catCountMap = new Map<number, number>();
    for (const cat of categories) {
      catCountMap.set(cat.id, cat._count.products);
    }
    for (const cat of categories) {
      if (cat.parentId && catCountMap.has(cat.parentId)) {
        catCountMap.set(cat.parentId, (catCountMap.get(cat.parentId) || 0) + cat._count.products);
      }
    }

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? undefined,
      parentId: c.parentId,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      productCount: catCountMap.get(c.id) ?? c._count.products,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getSellerSpotlights(): Promise<CustomerSellerSpotlight[]> {
    const approvedSellers = await this.prisma.sellerApproval.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
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
      },
    });

    return approvedSellers.map((appr) => {
      const s = appr.seller;
      const fProds = (s.sellerProducts || []).map((p) => this.mapProduct(p));
      const allSellerReviews = (s.sellerProducts || []).flatMap((p: any) => p.reviews || []);
      const sellerRatingAvg = allSellerReviews.length > 0
        ? Number((allSellerReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / allSellerReviews.length).toFixed(1))
        : 5.0;
      return {
        id: s.id,
        storeName: s.storeName || `${s.firstName} ${s.lastName}`,
        ownerName: `${s.firstName} ${s.lastName}`,
        businessCategory: s.businessCategory || 'Marketplace Seller',
        city: 'Pakistan',
        productCount: s.sellerProducts?.length || 0,
        rating: sellerRatingAvg,
        joinedDate: s.createdAt.toISOString(),
        featuredProducts: fProds,
      };
    });
  }
}
