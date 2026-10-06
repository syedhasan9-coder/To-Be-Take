import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatus, PrismaService, ReturnStatus } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminReturnsService } from './admin-returns.service';

describe('AdminReturnsService', () => {
  let service: AdminReturnsService;
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
    permissions: ['RETURNS_VIEW', 'RETURNS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      orderReturn: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'return-1',
            returnNumber: 'RET-1001-99',
            orderId: 'order-1',
            customerId: 'cust-1',
            sellerId: 'seller-1',
            reason: 'Item defective',
            status: ReturnStatus.REQUESTED,
            refundStatus: PaymentStatus.PENDING,
            refundAmount: 50.0,
            adminNotes: null,
            reviewedBy: null,
            reviewedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            order: { orderNumber: 'ORD-1001' },
            customer: { firstName: 'Liam', lastName: 'Customer', email: 'liam@tobetake.dev' },
            seller: { firstName: 'Apex', lastName: 'Store', storeName: 'Apex Store' },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'return-1',
          returnNumber: 'RET-1001-99',
          orderId: 'order-1',
          customerId: 'cust-1',
          sellerId: 'seller-1',
          reason: 'Item defective',
          status: ReturnStatus.REQUESTED,
          refundStatus: PaymentStatus.PENDING,
          refundAmount: 50.0,
          adminNotes: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          order: { orderNumber: 'ORD-1001' },
          customer: { firstName: 'Liam', lastName: 'Customer', email: 'liam@tobetake.dev' },
          seller: { firstName: 'Apex', lastName: 'Store', storeName: 'Apex Store' },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'return-1',
          returnNumber: 'RET-1001-99',
          orderId: 'order-1',
          customerId: 'cust-1',
          sellerId: 'seller-1',
          reason: 'Item defective',
          status: ReturnStatus.APPROVED,
          refundStatus: PaymentStatus.PENDING,
          refundAmount: 50.0,
          adminNotes: 'Approved for return inspection',
          reviewedBy: 'admin-uuid-1',
          reviewedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          order: { orderNumber: 'ORD-1001' },
          customer: { firstName: 'Liam', lastName: 'Customer', email: 'liam@tobetake.dev' },
          seller: { firstName: 'Apex', lastName: 'Store', storeName: 'Apex Store' },
        }),
      },
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReturnsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminReturnsService>(AdminReturnsService);
  });

  it('should list returns with order, customer and seller details', async () => {
    const result = await service.listReturns({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].returnNumber).toBe('RET-1001-99');
    expect(result.items[0].reason).toBe('Item defective');
  });

  it('should review return and record audit log', async () => {
    const updated = await service.reviewReturn(
      'return-1',
      { status: ReturnStatus.APPROVED, adminNotes: 'Approved for return inspection' },
      mockAdminUser,
    );

    expect(mockPrisma.orderReturn.update).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RETURN_REQUEST_REVIEWED',
        targetType: 'OrderReturn',
      }),
    );
  });
});
