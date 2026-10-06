import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminCommissionsService } from './admin-commissions.service';

describe('AdminCommissionsService', () => {
  let service: AdminCommissionsService;
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
    permissions: ['COMMISSIONS_VIEW', 'COMMISSIONS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      commissionRecord: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'comm-1',
            orderId: 'order-1',
            sellerId: 'seller-1',
            payoutId: null,
            orderAmount: 100.0,
            commissionRate: 10.0,
            platformFee: 10.0,
            sellerEarnings: 90.0,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: { orderNumber: 'ORD-1001' },
            seller: {
              id: 'seller-1',
              firstName: 'Apex',
              lastName: 'Store',
              storeName: 'Apex Store',
            },
          },
        ]),
      },
      platformSetting: {
        findUnique: jest.fn().mockResolvedValue({
          key: 'platform_commission_rate',
          value: '10.0',
        }),
        upsert: jest.fn().mockResolvedValue({
          key: 'platform_commission_rate',
          value: '12.5',
        }),
      },
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCommissionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminCommissionsService>(AdminCommissionsService);
  });

  it('should list commission records', async () => {
    const result = await service.listCommissions({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].platformFee).toBe(10.0);
    expect(result.items[0].sellerEarnings).toBe(90.0);
  });

  it('should update default platform commission rate and record audit log', async () => {
    await service.updateDefaultCommissionRate({ defaultRate: 12.5 }, mockAdminUser);
    expect(mockPrisma.platformSetting.upsert).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'COMMISSION_RATE_UPDATED',
        targetType: 'PlatformSetting',
      }),
    );
  });
});
