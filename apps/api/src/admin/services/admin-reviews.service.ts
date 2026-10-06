import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { PaginatedResult, ProductReviewItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { ModerateReviewDto, ReviewQueryDto } from '../dto/review.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminReviewsService {
  private readonly logger = new Logger(AdminReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List customer reviews with filtering and reported moderation flag.
   */
  async listReviews(query: ReviewQueryDto): Promise<PaginatedResult<ProductReviewItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isReported !== undefined) {
      where.isReported = query.isReported;
    }

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { comment: { contains: s, mode: 'insensitive' } },
        { product: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
            },
          },
        },
      }),
    ]);

    return {
      items: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        customerId: r.customerId,
        customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
        customerEmail: r.customer.email,
        sellerId: r.sellerId,
        sellerName: `${r.seller.firstName} ${r.seller.lastName}`.trim(),
        storeName: r.seller.storeName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        isReported: r.isReported,
        reportReason: r.reportReason,
        moderationNotes: r.moderationNotes,
        moderatedByName: null,
        moderatedAt: r.moderatedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single product review details.
   */
  async getReviewDetails(id: string): Promise<ProductReviewItem> {
    const r = await this.prisma.productReview.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        seller: true,
      },
    });

    if (!r) {
      throw new NotFoundException(`Review with ID '${id}' was not found`);
    }

    return {
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      customerId: r.customerId,
      customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      customerEmail: r.customer.email,
      sellerId: r.sellerId,
      sellerName: `${r.seller.firstName} ${r.seller.lastName}`.trim(),
      storeName: r.seller.storeName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      isReported: r.isReported,
      reportReason: r.reportReason,
      moderationNotes: r.moderationNotes,
      moderatedByName: null,
      moderatedAt: r.moderatedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * Moderate review status.
   */
  async moderateReview(
    id: string,
    dto: ModerateReviewDto,
    admin: AuthenticatedAdminUser,
  ): Promise<ProductReviewItem> {
    const existing = await this.prisma.productReview.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!existing) {
      throw new NotFoundException(`Review with ID '${id}' was not found`);
    }

    let targetStatus: Prisma.EnumReviewStatusFilter['equals'] | any = existing.status;
    const rawStatus = (dto.status || '').toUpperCase();
    if (rawStatus === 'PUBLISHED' || rawStatus === 'APPROVED') {
      targetStatus = 'APPROVED';
    } else if (rawStatus === 'HIDDEN' || rawStatus === 'REJECTED') {
      targetStatus = 'REJECTED';
    } else if (rawStatus === 'FLAGGED') {
      targetStatus = 'FLAGGED';
    } else if (rawStatus === 'PENDING') {
      targetStatus = 'PENDING';
    }

    const notes = dto.moderationNotes || dto.adminNotes || existing.moderationNotes;
    const isReported = dto.isFlagged !== undefined ? dto.isFlagged : dto.isReported !== undefined ? dto.isReported : existing.isReported;

    const updated = await this.prisma.productReview.update({
      where: { id },
      data: {
        status: targetStatus,
        isReported,
        moderationNotes: notes,
        moderatedBy: admin.id,
        moderatedAt: new Date(),
      },
      include: {
        product: true,
        customer: true,
        seller: true,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'REVIEW_MODERATED',
      targetType: 'ProductReview',
      targetId: id,
      details: {
        productName: existing.product.name,
        fromStatus: existing.status,
        toStatus: targetStatus,
        notes,
      },
    });


    return {
      id: updated.id,
      productId: updated.productId,
      productName: updated.product.name,
      customerId: updated.customerId,
      customerName: `${updated.customer.firstName} ${updated.customer.lastName}`.trim(),
      customerEmail: updated.customer.email,
      sellerId: updated.sellerId,
      sellerName: `${updated.seller.firstName} ${updated.seller.lastName}`.trim(),
      storeName: updated.seller.storeName,
      rating: updated.rating,
      title: updated.title,
      comment: updated.comment,
      status: updated.status,
      isReported: updated.isReported,
      reportReason: updated.reportReason,
      moderationNotes: updated.moderationNotes,
      moderatedByName: admin.username,
      moderatedAt: updated.moderatedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
