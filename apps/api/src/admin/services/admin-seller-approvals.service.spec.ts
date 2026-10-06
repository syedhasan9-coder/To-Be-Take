import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalStatus, PrismaService, UserStatus } from '@tobetake/database';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { AdminSellerApprovalsService } from './admin-seller-approvals.service';

describe('AdminSellerApprovalsService', () => {
  let service: AdminSellerApprovalsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AdminAuditService>;

  const mockAdminUser: AuthenticatedAdminUser = {
    id: 'admin-uuid',
    username: 'admin_approver',
    email: 'approver@tobetake.dev',
    firstName: 'Jane',
    lastName: 'Approver',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['SELLERS_VIEW', 'SELLERS_APPROVE'],
  };

  const mockApproval = {
    id: 'approval-uuid',
    sellerId: 'seller-uuid',
    status: ApprovalStatus.PENDING,
    reviewedBy: null,
    notes: null,
    rejectionReason: null,
    submittedAt: new Date(),
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: {
      id: 'seller-uuid',
      username: 'seller_botanica',
      email: 'botanica@tobetake.dev',
      firstName: 'Botanica',
      lastName: 'Store',
      storeName: 'Botanica Essentials',
      businessCategory: 'Beauty & Wellness',
      status: UserStatus.PENDING_VERIFICATION,
      isDeleted: false,
    },
    reviewer: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      sellerApproval: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSellerApprovalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminSellerApprovalsService>(AdminSellerApprovalsService);
    prisma = module.get(PrismaService);
    auditService = module.get(AdminAuditService);
  });

  it('should list approvals with pagination', async () => {
    (prisma.sellerApproval.count as jest.Mock).mockResolvedValue(1);
    (prisma.sellerApproval.findMany as jest.Mock).mockResolvedValue([mockApproval]);

    const result = await service.listApprovals({ status: 'PENDING', page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].storeName).toBe('Botanica Essentials');
    expect(result.items[0].status).toBe('PENDING');
  });

  it('should approve a seller and generate an audit record', async () => {
    (prisma.sellerApproval.findFirst as jest.Mock).mockResolvedValue(mockApproval);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
        reviewedBy: mockAdminUser.id,
        reviewedAt: new Date(),
      },
      {
        id: 'seller-uuid',
        status: UserStatus.ACTIVE,
      },
    ]);

    const result = await service.reviewApproval(
      'approval-uuid',
      { status: 'APPROVED', notes: 'Verified business registration' },
      mockAdminUser,
    );

    expect(result.status).toBe('APPROVED');
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SELLER_APPROVED',
        targetType: 'SellerApproval',
      }),
    );
  });

  it('should reject a seller with reason and generate an audit record', async () => {
    (prisma.sellerApproval.findFirst as jest.Mock).mockResolvedValue(mockApproval);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
        rejectionReason: 'Missing identification documents',
        reviewedBy: mockAdminUser.id,
        reviewedAt: new Date(),
      },
      {
        id: 'seller-uuid',
        status: UserStatus.INACTIVE,
      },
    ]);

    const result = await service.reviewApproval(
      'approval-uuid',
      { status: 'REJECTED', reason: 'Missing identification documents' },
      mockAdminUser,
    );

    expect(result.status).toBe('REJECTED');
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SELLER_REJECTED',
        targetType: 'SellerApproval',
      }),
    );
  });
});
