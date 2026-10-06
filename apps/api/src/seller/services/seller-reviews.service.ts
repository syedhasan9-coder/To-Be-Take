import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { PaginatedResult, ProductReviewItem } from '@tobetake/shared-types';

@Injectable()
export class SellerReviewsService {
  private readonly logger = new Logger(SellerReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReviews(
    sellerId: string,
    query: {
      productId?: string;
      rating?: number;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<ProductReviewItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = {
      sellerId,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.rating) {
      where.rating = Number(query.rating);
    }

    const [total, reviews] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        include: {
          product: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedItems: ProductReviewItem[] = reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      productTitle: r.product.name,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      customerEmail: r.customer.email,
      sellerId: r.sellerId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      isReported: r.isReported,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
