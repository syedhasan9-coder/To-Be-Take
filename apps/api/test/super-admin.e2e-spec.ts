import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService, UserStatus, ApprovalStatus } from '@tobetake/database';

describe('Super Admin Platform (e2e)', () => {
  let app: INestApplication;

  const mockSuperAdminRole = {
    id: 1,
    name: 'Super Admin',
    code: 'SPADMIN',
    description: 'Full platform privileges',
    rolePermissions: [
      { permission: { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users' } },
      {
        permission: {
          id: 2,
          code: 'SELLERS_APPROVE',
          name: 'Approve Sellers',
          category: 'Sellers',
        },
      },
      {
        permission: {
          id: 3,
          code: 'SETTINGS_MANAGE',
          name: 'Manage Settings',
          category: 'Settings',
        },
      },
    ],
  };

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Operational privileges',
    rolePermissions: [
      { permission: { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users' } },
      {
        permission: {
          id: 2,
          code: 'SELLERS_APPROVE',
          name: 'Approve Sellers',
          category: 'Sellers',
        },
      },
      { permission: { id: 4, code: 'USERS_SUSPEND', name: 'Suspend Users', category: 'Users' } },
    ],
  };

  const mockSuperAdminUser = {
    id: 'spadmin-e2e-id',
    username: 'superadmin_e2e',
    email: 'spadmin.e2e@tobetake.dev',
    roleId: 1,
    role: mockSuperAdminRole,
    departmentId: 1,
    department: { id: 1, name: 'Administration', code: 'ADMN' },
    designation: 'Chief Administrator',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: true,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNormalAdminUser = {
    id: 'admin-e2e-id',
    username: 'normal_admin_e2e',
    email: 'normal.admin@tobetake.dev',
    roleId: 2,
    role: mockAdminRole,
    departmentId: 1,
    department: { id: 1, name: 'Administration', code: 'ADMN' },
    designation: 'Operations Specialist',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: false,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerUser = {
    id: 'seller-e2e-id',
    username: 'seller_organics',
    email: 'organics@tobetake.dev',
    firstName: 'Organic',
    lastName: 'Store',
    storeName: 'Organic Haven',
    businessCategory: 'Grocery & Food',
    roleId: 3,
    role: { id: 3, name: 'Seller', code: 'VENDOR' },
    status: UserStatus.PENDING_VERIFICATION,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApprovalRecord = {
    id: 'approval-e2e-id',
    sellerId: 'seller-e2e-id',
    status: ApprovalStatus.PENDING,
    reviewedBy: null,
    notes: null,
    rejectionReason: null,
    submittedAt: new Date(),
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: mockSellerUser,
    reviewer: null,
  };

  const mockPrismaService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    user: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([mockSuperAdminUser, mockSellerUser]),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const identifier = where?.id || where?.OR?.[0]?.username || where?.OR?.[0]?.id;
        if (identifier === 'spadmin-e2e-id' || identifier === 'superadmin_e2e') {
          return Promise.resolve(mockSuperAdminUser);
        }
        if (identifier === 'admin-e2e-id' || identifier === 'normal_admin_e2e') {
          return Promise.resolve(mockNormalAdminUser);
        }
        return Promise.resolve(mockSuperAdminUser);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'spadmin-e2e-id') return Promise.resolve(mockSuperAdminUser);
        if (where.id === 'admin-e2e-id') return Promise.resolve(mockNormalAdminUser);
        if (where.id === 'seller-e2e-id') return Promise.resolve(mockSellerUser);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where: _where, data }) => {
        return Promise.resolve({
          ...mockSellerUser,
          ...data,
        });
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'new-user-id',
          ...data,
          role: mockAdminRole,
          department: { id: 1, name: 'Administration' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ businessCategory: 'Grocery & Food', _count: { id: 1 } }]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { failedLoginAttempts: 0 } }),
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([mockSuperAdminRole, mockAdminRole]),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.code === 'SPADMIN' || where.id === 1) return Promise.resolve(mockSuperAdminRole);
        if (where.code === 'ADMIN' || where.id === 2) return Promise.resolve(mockAdminRole);
        return Promise.resolve(null);
      }),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Administration', code: 'ADMN' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Administration', code: 'ADMN' }),
    },
    permission: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users' },
        { id: 2, code: 'SELLERS_APPROVE', name: 'Approve Sellers', category: 'Sellers' },
        { id: 3, code: 'SETTINGS_MANAGE', name: 'Manage Settings', category: 'Settings' },
      ]),
    },
    rolePermission: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    sellerApproval: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockApprovalRecord]),
      findFirst: jest.fn().mockResolvedValue(mockApprovalRecord),
      update: jest.fn().mockResolvedValue({
        ...mockApprovalRecord,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
      }),
    },
    order: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: '500.00' } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    orderReturn: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    sellerPayout: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      count: jest.fn().mockResolvedValue(12),
      findMany: jest.fn().mockResolvedValue([]),
    },
    inventoryItem: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([]),
    },
    commissionRecord: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { platformFee: '50.00', sellerEarnings: '450.00' } }),
    },
    orderItem: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    productReview: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    platformSetting: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, key: 'platform_name', value: 'To Be Take', category: 'GENERAL', isPublic: true },
        { id: 2, key: 'maintenance_mode', value: 'false', category: 'MAINTENANCE', isPublic: true },
      ]),
      upsert: jest.fn().mockResolvedValue({ id: 1, key: 'platform_name', value: 'To Be Take' }),
    },
    userSession: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((args) => {
      if (Array.isArray(args)) {
        return Promise.all(args);
      }
      if (typeof args === 'function') {
        return args(mockPrismaService);
      }
      return Promise.resolve(args);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return live dashboard metrics for Super Admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('x-user-id', 'spadmin-e2e-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kpis).toBeDefined();
      expect(response.body.data.systemOverview).toBeDefined();
      expect(response.body.data.growth).toBeDefined();
    });
  });

  describe('Critical Super Admin Seller Approvals Flow & Audit Logging', () => {
    it('should approve seller onboarding and record audit log', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/admin/seller-approvals/approval-e2e-id/review')
        .set('x-user-id', 'spadmin-e2e-id')
        .send({
          status: 'APPROVED',
          notes: 'Business verified during e2e test',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SELLER_APPROVED',
            targetType: 'SellerApproval',
          }),
        }),
      );
    });
  });

  describe('Critical Security Protection & 403 Forbidden Checks', () => {
    it('Normal ADMIN cannot modify Role Permissions (Super Admin only endpoint) -> 403 Forbidden', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/admin/roles-permissions')
        .set('x-user-id', 'admin-e2e-id')
        .send({
          roleId: 2,
          permissionIds: [1, 2],
        })
        .expect(403);

      expect(response.body.message).toContain('Super Admin privilege required');
    });

    it('Normal ADMIN cannot suspend or deactivate Super Admin account -> 403 Forbidden', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/admin/users/spadmin-e2e-id/status')
        .set('x-user-id', 'admin-e2e-id')
        .send({
          status: 'SUSPENDED',
        })
        .expect(403);

      expect(response.body.message).toContain('Super Admin account protection');
    });

    it('Super Admin CAN update role permissions successfully', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/admin/roles-permissions')
        .set('x-user-id', 'spadmin-e2e-id')
        .send({
          roleId: 2,
          permissionIds: [1, 2],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Admin CSV Export Endpoints', () => {
    it('GET /api/admin/audit-logs/export should stream CSV attachment with headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/audit-logs/export')
        .set('x-user-id', 'spadmin-e2e-id')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain(
        'attachment; filename="audit-logs-',
      );
      expect(response.text).toContain('Event ID,Action,Actor Name,Actor Email,Actor Role');
    });

    it('GET /api/admin/reports/export should stream platform reports CSV attachment', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/reports/export')
        .set('x-user-id', 'spadmin-e2e-id')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain(
        'attachment; filename="platform-reports-',
      );
      expect(response.text).toContain(
        '# TO BE TAKE MARKETPLACE - PLATFORM PERFORMANCE & GOVERNANCE REPORT',
      );
      expect(response.text).toContain('# EXECUTIVE SUMMARY METRICS');
    });
  });
});
