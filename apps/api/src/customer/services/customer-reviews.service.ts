import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, ReviewStatus } from '@tobetake/database';
import { CustomerReviewItem, SubmitReviewInput } from '@tobetake/shared-types';

@Injectable()
export class CustomerReviewsService {
  private readonly logger = new Logger(CustomerReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCustomerReviews(userId: string): Promise<CustomerReviewItem[]> {
    const reviews = await this.prisma.productReview.findMany({
      where: { customerId: userId },
      include: {
        product: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || 'Product',
      productSlug: r.product?.slug || '',
      productImage: (r.product?.images as string[])?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300',
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`,
      rating: Number(r.rating),
      title: r.title ?? null,
      comment: r.comment || '',
      isVerifiedPurchase: true,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async submitReview(userId: string, input: SubmitReviewInput): Promise<CustomerReviewItem> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: { seller: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5 stars.');
    }

    const existing = await this.prisma.productReview.findFirst({
      where: {
        productId: input.productId,
        customerId: userId,
      },
    });

    let review;
    if (existing) {
      review = await this.prisma.productReview.update({
        where: { id: existing.id },
        data: {
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || '',
          status: ReviewStatus.APPROVED,
        },
        include: {
          product: true,
          customer: true,
        },
      });
    } else {
      review = await this.prisma.productReview.create({
        data: {
          productId: input.productId,
          customerId: userId,
          sellerId: product.sellerId,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || '',
          status: ReviewStatus.APPROVED,
        },
        include: {
          product: true,
          customer: true,
        },
      });
    }

    return {
      id: review.id,
      productId: review.productId,
      productName: review.product?.name,
      productSlug: review.product?.slug,
      productImage: (review.product?.images as string[])?.[0],
      customerId: review.customerId,
      customerName: `${review.customer.firstName} ${review.customer.lastName}`,
      rating: Number(review.rating),
      title: review.title ?? null,
      comment: review.comment || '',
      isVerifiedPurchase: true,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
