import { Test, TestingModule } from '@nestjs/testing';
import { PayoutStatus, PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminPayoutsService } from './admin-payouts.service';

describe('AdminPayoutsService', () => {
  let service: AdminPayoutsService;
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
    permissions: ['PAYOUTS_VIEW', 'PAYOUTS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      sellerPayout: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'payout-1',
            payoutNumber: 'PAY-1001-202',
            sellerId: 'seller-1',
            amount: 450.0,
            currency: 'PKR',
            status: PayoutStatus.PENDING,
            periodStart: null,
            periodEnd: null,
            processedAt: null,
            processedBy: null,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            seller: { firstName: 'Tariq', lastName: 'Mehmood', storeName: 'Al-Madina Store' },
            _count: { commissions: 5 },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'payout-1',
          payoutNumber: 'PAY-1001-202',
          sellerId: 'seller-1',
          amount: 450.0,
          currency: 'PKR',
          status: PayoutStatus.PENDING,
          periodStart: null,
          periodEnd: null,
          processedAt: null,
          processedBy: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: { firstName: 'Tariq', lastName: 'Mehmood', storeName: 'Al-Madina Store' },
          _count: { commissions: 5 },
        }),
        create: jest.fn().mockResolvedValue({
          id: 'payout-2',
          payoutNumber: 'PAY-1002-303',
          sellerId: 'seller-1',
          amount: 200.0,
          currency: 'PKR',
          status: PayoutStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'payout-1',
          payoutNumber: 'PAY-1001-202',
          sellerId: 'seller-1',
          amount: 450.0,
          currency: 'PKR',
          status: PayoutStatus.PAID,
          processedAt: new Date(),
          processedBy: 'admin-uuid-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'seller-1',
          sellerCommissions: [{ id: 'comm-1', sellerEarnings: 200.0 }],
        }),
      },
      commissionRecord: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPayoutsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminPayoutsService>(AdminPayoutsService);
  });

  it('should list payouts with seller information', async () => {
    const result = await service.listPayouts({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].payoutNumber).toBe('PAY-1001-202');
    expect(result.items[0].amount).toBe(450.0);
  });

  it('should process payout to PAID status and record audit log', async () => {
    const processed = await service.processPayout(
      'payout-1',
      { status: PayoutStatus.PAID, notes: 'Transferred via wire' },
      mockAdminUser,
    );

    expect(mockPrisma.sellerPayout.update).toHaveBeenCalled();
    expect(mockPrisma.commissionRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'PAID' },
      }),
    );
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PAYOUT_STATUS_UPDATED',
        targetType: 'SellerPayout',
      }),
    );
  });
});
