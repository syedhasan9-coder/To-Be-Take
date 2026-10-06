import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, Prisma, PrismaService, UserStatus } from '@tobetake/database';
import { PaginatedResult, SellerApprovalItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { ReviewSellerApprovalDto } from '../dto/review-seller-approval.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminSellerApprovalsService {
  private readonly logger = new Logger(AdminSellerApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves paginated seller approvals.
   * If a seller (role VENDOR) exists without an explicit SellerApproval row,
   * an initial PENDING record is automatically ensured so no seller is missed.
   */
  async listApprovals(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SellerApprovalItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    // Synchronize any sellers without approval records
    const sellersWithoutApproval = await this.prisma.user.findMany({
      where: {
        role: { code: 'VENDOR' },
        isDeleted: false,
        sellerApprovals: { none: {} },
      },
      select: { id: true, createdAt: true, status: true },
    });

    if (sellersWithoutApproval.length > 0) {
      for (const s of sellersWithoutApproval) {
        await this.prisma.sellerApproval.create({
          data: {
            sellerId: s.id,
            status:
              s.status === UserStatus.ACTIVE ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
            submittedAt: s.createdAt,
          },
        });
      }
    }

    const where: Prisma.SellerApprovalWhereInput = {
      seller: { isDeleted: false },
    };

    if (query.status && ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(query.status)) {
      where.status = query.status as ApprovalStatus;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { seller: { storeName: { contains: s, mode: 'insensitive' } } },
        { seller: { businessCategory: { contains: s, mode: 'insensitive' } } },
        { seller: { username: { contains: s, mode: 'insensitive' } } },
        { seller: { email: { contains: s, mode: 'insensitive' } } },
        { seller: { firstName: { contains: s, mode: 'insensitive' } } },
        { seller: { lastName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, approvals] = await Promise.all([
      this.prisma.sellerApproval.count({ where }),
      this.prisma.sellerApproval.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          seller: true,
          reviewer: true,
        },
      }),
    ]);

    const items: SellerApprovalItem[] = approvals.map((a) => ({
      id: a.id,
      sellerId: a.sellerId,
      sellerUsername: a.seller.username,
      sellerEmail: a.seller.email,
      sellerName: `${a.seller.firstName} ${a.seller.lastName}`.trim(),
      storeName: a.seller.storeName,
      businessCategory: a.seller.businessCategory,
      status: a.status as unknown as SellerApprovalItem['status'],
      accountStatus: a.seller.status as unknown as SellerApprovalItem['accountStatus'],
      notes: a.notes,
      rejectionReason: a.rejectionReason,
      submittedAt: a.submittedAt,
      reviewedAt: a.reviewedAt,
      reviewedByName: a.reviewer ? `${a.reviewer.firstName} ${a.reviewer.lastName}` : null,
      createdAt: a.createdAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single seller approval detail.
   */
  async getApprovalDetails(id: string): Promise<SellerApprovalItem> {
    const approval = await this.prisma.sellerApproval.findFirst({
      where: {
        OR: [{ id }, { sellerId: id }],
      },
      include: {
        seller: true,
        reviewer: true,
      },
    });

    if (!approval || approval.seller.isDeleted) {
      throw new NotFoundException(`Seller approval request was not found.`);
    }

    return {
      id: approval.id,
      sellerId: approval.sellerId,
      sellerUsername: approval.seller.username,
      sellerEmail: approval.seller.email,
      sellerName: `${approval.seller.firstName} ${approval.seller.lastName}`.trim(),
      storeName: approval.seller.storeName,
      businessCategory: approval.seller.businessCategory,
      status: approval.status as unknown as SellerApprovalItem['status'],
      accountStatus: approval.seller.status as unknown as SellerApprovalItem['accountStatus'],
      notes: approval.notes,
      rejectionReason: approval.rejectionReason,
      submittedAt: approval.submittedAt,
      reviewedAt: approval.reviewedAt,
      reviewedByName: approval.reviewer
        ? `${approval.reviewer.firstName} ${approval.reviewer.lastName}`
        : null,
      createdAt: approval.createdAt,
    };
  }

  /**
   * Reviews and processes seller approval (APPROVE, REJECT, SUSPEND, PENDING).
   */
  async reviewApproval(
    approvalIdOrSellerId: string,
    dto: ReviewSellerApprovalDto,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<SellerApprovalItem> {
    let approval = await this.prisma.sellerApproval.findFirst({
      where: {
        OR: [{ id: approvalIdOrSellerId }, { sellerId: approvalIdOrSellerId }],
      },
      include: { seller: true },
    });

    if (!approval) {
      // Check if valid seller user exists
      const seller = await this.prisma.user.findUnique({
        where: { id: approvalIdOrSellerId },
      });
      if (!seller) {
        throw new NotFoundException(`Seller approval record not found.`);
      }
      approval = await this.prisma.sellerApproval.create({
        data: {
          sellerId: seller.id,
          status: ApprovalStatus.PENDING,
          submittedAt: seller.createdAt,
        },
        include: { seller: true },
      });
    }

    const previousStatus = approval.status;
    let targetUserStatus: UserStatus = approval.seller.status;

    if (dto.status === 'APPROVED') {
      targetUserStatus = UserStatus.ACTIVE;
    } else if (dto.status === 'REJECTED') {
      targetUserStatus = UserStatus.INACTIVE;
    } else if (dto.status === 'SUSPENDED') {
      targetUserStatus = UserStatus.SUSPENDED;
    } else if (dto.status === 'PENDING') {
      targetUserStatus = UserStatus.PENDING_VERIFICATION;
    }

    // Update SellerApproval and User
    const [updatedApproval] = await this.prisma.$transaction([
      this.prisma.sellerApproval.update({
        where: { id: approval.id },
        data: {
          status: dto.status as ApprovalStatus,
          reviewedBy: currentAdmin.id,
          reviewedAt: new Date(),
          notes: dto.notes,
          rejectionReason: dto.reason,
        },
        include: {
          seller: true,
          reviewer: true,
        },
      }),
      this.prisma.user.update({
        where: { id: approval.sellerId },
        data: {
          status: targetUserStatus,
          updatedBy: currentAdmin.id,
        },
      }),
    ]);

    // Record audit log
    await this.auditService.recordLog({
      actor: currentAdmin,
      action: `SELLER_${dto.status}`,
      targetType: 'SellerApproval',
      targetId: updatedApproval.id,
      status: 'SUCCESS',
      details: {
        sellerId: updatedApproval.sellerId,
        storeName: updatedApproval.seller.storeName,
        sellerEmail: updatedApproval.seller.email,
        previousApprovalStatus: previousStatus,
        newApprovalStatus: dto.status,
        rejectionReason: dto.reason,
        notes: dto.notes,
      },
    });

    return {
      id: updatedApproval.id,
      sellerId: updatedApproval.sellerId,
      sellerUsername: updatedApproval.seller.username,
      sellerEmail: updatedApproval.seller.email,
      sellerName: `${updatedApproval.seller.firstName} ${updatedApproval.seller.lastName}`.trim(),
      storeName: updatedApproval.seller.storeName,
      businessCategory: updatedApproval.seller.businessCategory,
      status: updatedApproval.status as unknown as SellerApprovalItem['status'],
      accountStatus: targetUserStatus as unknown as SellerApprovalItem['accountStatus'],
      notes: updatedApproval.notes,
      rejectionReason: updatedApproval.rejectionReason,
      submittedAt: updatedApproval.submittedAt,
      reviewedAt: updatedApproval.reviewedAt,
      reviewedByName: `${currentAdmin.firstName} ${currentAdmin.lastName}`.trim(),
      createdAt: updatedApproval.createdAt,
    };
  }
}
