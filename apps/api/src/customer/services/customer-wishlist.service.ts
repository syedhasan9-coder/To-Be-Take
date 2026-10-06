import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, ProductStatus } from '@tobetake/database';
import { CustomerWishlistItem } from '@tobetake/shared-types';

@Injectable()
export class CustomerWishlistService {
  private readonly logger = new Logger(CustomerWishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string): Promise<CustomerWishlistItem[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            inventory: true,
            seller: true,
            category: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => {
      const p = item.product;
      const rawImages = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
      const images = rawImages.map(String);
      const mainImage = images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400';
      const price = Number(p.price) || 0;
      const comparePrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
      const stock = p.inventory ? Number(p.inventory.stockQuantity) : 0;
      const inStock = p.status === ProductStatus.ACTIVE && !p.isDeleted && stock > 0;

      const reviews = p.reviews || [];
      const ratingAvg = reviews.length > 0
        ? Number((reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1))
        : 0;

      return {
        id: item.id,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        image: mainImage,
        price,
        compareAtPrice: comparePrice,
        inStock,
        stockQuantity: stock,
        rating: ratingAvg,
        storeName: p.seller?.storeName || `${p.seller?.firstName} ${p.seller?.lastName}` || 'Merchant',
        addedAt: item.createdAt.toISOString(),
      };
    });
  }

  async toggleWishlist(userId: string, productId: string): Promise<{ wishlisted: boolean; items: CustomerWishlistItem[] }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let wishlisted = false;

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      wishlisted = false;
    } else {
      await this.prisma.wishlistItem.create({
        data: {
          userId,
          productId,
        },
      });
      wishlisted = true;
    }

    const items = await this.getWishlist(userId);
    return { wishlisted, items };
  }

  async removeItem(userId: string, productId: string): Promise<CustomerWishlistItem[]> {
    const existing = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        OR: [
          { id: productId },
          { productId },
        ],
      },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
    }

    return this.getWishlist(userId);
  }
}
