import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminReportsService } from './admin-reports.service';

describe('AdminReportsService', () => {
  let service: AdminReportsService;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.role?.code === 'CUST') return Promise.resolve(50);
          if (where?.role?.code === 'VENDOR') return Promise.resolve(20);
          if (where?.role?.code === 'ADMIN') return Promise.resolve(4);
          if (where?.role?.code === 'SPADMIN') return Promise.resolve(1);
          if (where?.status === 'ACTIVE') return Promise.resolve(65);
          if (where?.status === 'INACTIVE') return Promise.resolve(5);
          if (where?.status === 'SUSPENDED') return Promise.resolve(3);
          if (where?.status === 'PENDING_VERIFICATION') return Promise.resolve(2);
          if (where?.isEmailVerified === true) return Promise.resolve(60);
          return Promise.resolve(75);
        }),
        groupBy: jest.fn().mockResolvedValue([
          { businessCategory: 'Electronics & Gadgets', _count: { id: 12 } },
          { businessCategory: 'Grocery & Food', _count: { id: 8 } },
        ]),
        findMany: jest.fn().mockResolvedValue([
          { createdAt: new Date('2026-05-01'), role: { code: 'CUST' } },
          { createdAt: new Date('2026-06-01'), role: { code: 'VENDOR' } },
          { createdAt: new Date('2026-07-01'), role: { code: 'ADMIN' } },
        ]),
      },
      sellerApproval: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.status === 'APPROVED') return Promise.resolve(16);
          if (where?.status === 'PENDING') return Promise.resolve(3);
          if (where?.status === 'REJECTED') return Promise.resolve(1);
          if (where?.status === 'SUSPENDED') return Promise.resolve(0);
          return Promise.resolve(20);
        }),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'audit-log-1',
            actorId: 'admin-1',
            actorName: 'admin_ops',
            actorEmail: 'admin@tobetake.dev',
            actorRole: 'ADMIN',
            action: 'SELLER_APPROVED',
            targetType: 'SellerApproval',
            targetId: 'approval-1',
            status: 'SUCCESS',
            details: null,
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date('2026-09-20T10:00:00Z'),
          },
        ]),
      },
      order: {
        count: jest.fn().mockResolvedValue(10),
        aggregate: jest.fn().mockResolvedValue({ _sum: { total: 1500.0 } }),
        groupBy: jest.fn().mockResolvedValue([{ status: 'CONFIRMED', _count: { id: 10 } }]),
      },
      commissionRecord: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { platformFee: 150.0, sellerEarnings: 1350.0 } }),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            productName: 'Organic Tea',
            totalPrice: 200,
            quantity: 5,
            product: { category: { name: 'Beverages' } },
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminReportsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AdminReportsService>(AdminReportsService);
  });

  it('should generate complete aggregated reports data', async () => {
    const reports = await service.getReports();

    expect(reports.summary.totalAccounts).toBe(75);
    expect(reports.userDistribution.customers).toBe(50);
    expect(reports.userDistribution.sellers).toBe(20);
    expect(reports.sellerApprovals.approved).toBe(16);
    expect(reports.registrationsByCategory).toHaveLength(2);
    expect(reports.recentAdminActivities).toHaveLength(1);
    expect(reports.growth).toBeDefined();
  });

  it('should export formatted platform reports CSV', async () => {
    const csv = await service.exportReportsCsv();

    expect(csv).toContain('# TO BE TAKE MARKETPLACE - PLATFORM PERFORMANCE & GOVERNANCE REPORT');
    expect(csv).toContain('# EXECUTIVE SUMMARY METRICS');
    expect(csv).toContain('Total Registered Accounts,75');
    expect(csv).toContain('# USER ROLE DISTRIBUTION');
    expect(csv).toContain('Customers / Buyers,50');
    expect(csv).toContain('# SELLER BUSINESS CATEGORIES');
    expect(csv).toContain('"Electronics & Gadgets",12');
    expect(csv).toContain('# HISTORICAL GROWTH TELEMETRY');
  });
});
