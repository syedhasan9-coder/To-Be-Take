import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, ReviewStatus } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminReviewsService } from './admin-reviews.service';

describe('AdminReviewsService', () => {
  let service: AdminReviewsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    username: 'admin_ops',
    email: 'admin@tobetake.dev',
    firstName: 'Admin',
    lastName: 'Ops',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['REVIEWS_VIEW', 'REVIEWS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      productReview: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rev-1',
            productId: 'prod-1',
            customerId: 'cust-1',
            sellerId: 'seller-1',
            rating: 5,
            title: 'Exceptional craftsmanship',
            comment: 'Very pleased with the ceramic build quality.',
            status: ReviewStatus.PENDING,
            isReported: false,
            reportReason: null,
            moderationNotes: null,
            moderatedBy: null,
            moderatedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: { name: 'Ceramic Vase' },
            customer: { firstName: 'Emma', lastName: 'Davis', email: 'emma@tobetake.dev' },
            seller: { firstName: 'Artisan', lastName: 'Workshop', storeName: 'Artisan Workshop' },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'rev-1',
          productId: 'prod-1',
          customerId: 'cust-1',
          sellerId: 'seller-1',
          rating: 5,
          title: 'Exceptional craftsmanship',
          comment: 'Very pleased with the ceramic build quality.',
          status: ReviewStatus.PENDING,
          isReported: false,
          reportReason: null,
          moderationNotes: null,
          moderatedBy: null,
          moderatedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { name: 'Ceramic Vase' },
          customer: { firstName: 'Emma', lastName: 'Davis', email: 'emma@tobetake.dev' },
          seller: { firstName: 'Artisan', lastName: 'Workshop', storeName: 'Artisan Workshop' },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'rev-1',
          productId: 'prod-1',
          customerId: 'cust-1',
          sellerId: 'seller-1',
          rating: 5,
          title: 'Exceptional craftsmanship',
          comment: 'Very pleased with the ceramic build quality.',
          status: ReviewStatus.APPROVED,
          isReported: false,
          reportReason: null,
          moderationNotes: 'Approved for public listing',
          moderatedBy: 'admin-uuid-1',
          moderatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { name: 'Ceramic Vase' },
          customer: { firstName: 'Emma', lastName: 'Davis', email: 'emma@tobetake.dev' },
          seller: { firstName: 'Artisan', lastName: 'Workshop', storeName: 'Artisan Workshop' },
        }),
      },
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminReviewsService>(AdminReviewsService);
  });

  it('should list reviews with customer, product and seller data', async () => {
    const result = await service.listReviews({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].rating).toBe(5);
    expect(result.items[0].productName).toBe('Ceramic Vase');
  });

  it('should moderate review status and record audit log', async () => {
    await service.moderateReview(
      'rev-1',
      { status: ReviewStatus.APPROVED, moderationNotes: 'Approved for public listing' },
      mockAdminUser,
    );

    expect(mockPrisma.productReview.update).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REVIEW_MODERATED',
        targetType: 'ProductReview',
      }),
    );
  });
});
