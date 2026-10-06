import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService, UserStatus, ApprovalStatus, OrderStatus, PaymentStatus, ProductStatus, ReturnStatus, ReviewStatus } from '@tobetake/database';

describe('Admin Operational Experience & RBAC Boundaries (e2e)', () => {
  let app: INestApplication;

  const mockAdminPermissions = [
    { permission: { id: 1, code: 'DASHBOARD_VIEW', name: 'View Dashboard', category: 'Dashboard' } },
    { permission: { id: 2, code: 'CUSTOMERS_VIEW', name: 'View Customers', category: 'Customers' } },
    { permission: { id: 3, code: 'CUSTOMERS_MANAGE', name: 'Manage Customers', category: 'Customers' } },
    { permission: { id: 4, code: 'SELLERS_VIEW', name: 'View Sellers', category: 'Sellers' } },
    { permission: { id: 5, code: 'SELLERS_APPROVE', name: 'Approve Sellers', category: 'Sellers' } },
    { permission: { id: 6, code: 'SELLERS_MANAGE', name: 'Manage Sellers', category: 'Sellers' } },
    { permission: { id: 7, code: 'PRODUCTS_VIEW', name: 'View Products', category: 'Products' } },
    { permission: { id: 8, code: 'PRODUCTS_MANAGE', name: 'Manage Products', category: 'Products' } },
    { permission: { id: 9, code: 'PRODUCTS_MODERATE', name: 'Moderate Products', category: 'Products' } },
    { permission: { id: 10, code: 'CATEGORIES_VIEW', name: 'View Categories', category: 'Categories' } },
    { permission: { id: 11, code: 'CATEGORIES_MANAGE', name: 'Manage Categories', category: 'Categories' } },
    { permission: { id: 12, code: 'INVENTORY_VIEW', name: 'View Inventory', category: 'Inventory' } },
    { permission: { id: 13, code: 'INVENTORY_MANAGE', name: 'Manage Inventory', category: 'Inventory' } },
    { permission: { id: 14, code: 'ORDERS_VIEW', name: 'View Orders', category: 'Orders' } },
    { permission: { id: 15, code: 'ORDERS_MANAGE', name: 'Manage Orders', category: 'Orders' } },
    { permission: { id: 16, code: 'SHIPPING_VIEW', name: 'View Shipping', category: 'Shipping' } },
    { permission: { id: 17, code: 'SHIPPING_MANAGE', name: 'Manage Shipping', category: 'Shipping' } },
    { permission: { id: 18, code: 'PAYMENTS_VIEW', name: 'View Payments', category: 'Payments' } },
    { permission: { id: 19, code: 'PAYMENTS_MANAGE', name: 'Manage Payments', category: 'Payments' } },
    { permission: { id: 20, code: 'COMMISSIONS_VIEW', name: 'View Commissions', category: 'Commissions' } },
    { permission: { id: 21, code: 'PAYOUTS_VIEW', name: 'View Payouts', category: 'Payouts' } },
    { permission: { id: 22, code: 'PAYOUTS_MANAGE', name: 'Manage Payouts', category: 'Payouts' } },
    { permission: { id: 23, code: 'RETURNS_VIEW', name: 'View Returns', category: 'Returns' } },
    { permission: { id: 24, code: 'RETURNS_MANAGE', name: 'Manage Returns', category: 'Returns' } },
    { permission: { id: 25, code: 'REVIEWS_VIEW', name: 'View Reviews', category: 'Reviews' } },
    { permission: { id: 26, code: 'REVIEWS_MANAGE', name: 'Manage Reviews', category: 'Reviews' } },
    { permission: { id: 27, code: 'NOTIFICATIONS_VIEW', name: 'View Notifications', category: 'Notifications' } },
    { permission: { id: 28, code: 'NOTIFICATIONS_MANAGE', name: 'Manage Notifications', category: 'Notifications' } },
    { permission: { id: 29, code: 'REPORTS_VIEW', name: 'View Reports', category: 'Reports' } },
    { permission: { id: 30, code: 'AUDIT_LOGS_VIEW', name: 'View Audit Logs', category: 'Audit' } },
    { permission: { id: 31, code: 'PROFILE_VIEW', name: 'View Profile', category: 'Profile' } },
    { permission: { id: 32, code: 'PROFILE_MANAGE', name: 'Manage Profile', category: 'Profile' } },
    { permission: { id: 33, code: 'USERS_VIEW', name: 'View Users', category: 'Users' } },
    { permission: { id: 34, code: 'USERS_SUSPEND', name: 'Suspend Users', category: 'Users' } },
  ];

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    description: 'Operational privileges',
    rolePermissions: mockAdminPermissions,
  };

  const mockCustomerRole = {
    id: 4,
    name: 'Customer',
    code: 'CUSTOMER',
    description: 'Buyer role',
    rolePermissions: [],
  };

  const mockVendorRole = {
    id: 3,
    name: 'Seller',
    code: 'VENDOR',
    description: 'Seller role',
    rolePermissions: [],
  };

  const mockNormalAdminUser = {
    id: 'admin-op-id',
    username: 'operational_admin',
    email: 'admin.op@tobetake.dev',
    firstName: 'Ops',
    lastName: 'Admin',
    roleId: 2,
    role: mockAdminRole,
    departmentId: 1,
    department: { id: 1, name: 'Administration', code: 'ADMN' },
    designation: 'Operations Specialist',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: true,
    isLocked: false,
    lockedUntil: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomerUser = {
    id: 'customer-op-id',
    username: 'shopper_fatima',
    email: 'fatima@example.pk',
    firstName: 'Fatima',
    lastName: 'Khan',
    roleId: 4,
    role: mockCustomerRole,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: false,
    isLocked: false,
    lastLogin: new Date(),
    departmentId: null,
    department: null,
    designation: null,
    storeName: null,
    businessCategory: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    customerOrders: [
      {
        id: 'order-op-1',
        orderNumber: 'TBT-OP-1001',
        customerId: 'customer-op-id',
        status: OrderStatus.PENDING,
        total: '3499.00',
        createdAt: new Date(),
        customer: { id: 'customer-op-id', firstName: 'Fatima', lastName: 'Khan', email: 'fatima@example.pk', username: 'shopper_fatima' },
        _count: { items: 1 },
      },
    ],
  };

  const mockVendorUser = {
    id: 'vendor-op-id',
    username: 'lahore_spices',
    email: 'spices@example.pk',
    firstName: 'Tariq',
    lastName: 'Mehmood',
    storeName: 'Lahore Spice & Botanicals',
    businessCategory: 'Herbal & Wellness',
    roleId: 3,
    role: mockVendorRole,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: true,
    isLocked: false,
    lastLogin: new Date(),
    departmentId: null,
    department: null,
    designation: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    sellerProducts: [
      {
        id: 'prod-op-1',
        name: 'Peshawar Organic Green Tea',
        slug: 'peshawar-organic-green-tea',
        sku: 'TEA-PSH-001',
        price: '1850.00',
        categoryId: 1,
        sellerId: 'vendor-op-id',
        category: { id: 1, name: 'Herbal Teas' },
        inventory: { stockQuantity: 15 },
        isDeleted: false,
      },
    ],
    sellerCommissions: [
      {
        id: 'comm-1',
        orderId: 'order-op-1',
        orderAmount: '1850.00',
        platformFee: '185.00',
        sellerEarnings: '1665.00',
        order: { orderNumber: 'TBT-OP-1001', createdAt: new Date() },
        createdAt: new Date(),
      },
    ],
    sellerPayouts: [
      {
        id: 'pay-1',
        amount: '1500.00',
        status: 'PAID',
        createdAt: new Date(),
      },
    ],
  };

  const mockProduct = {
    id: 'prod-op-1',
    name: 'Peshawar Organic Green Tea',
    slug: 'peshawar-organic-green-tea',
    sku: 'TEA-PSH-001',
    price: '1850.00',
    stockQuantity: 15,
    status: ProductStatus.ACTIVE,
    sellerId: 'vendor-op-id',
    seller: mockVendorUser,
    category: { id: 1, name: 'Herbal Teas', slug: 'herbal-teas' },
    images: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-op-1',
    orderNumber: 'TBT-OP-1001',
    customerId: 'customer-op-id',
    customer: mockCustomerUser,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PAID,
    currency: 'PKR',
    subtotal: '1850.00',
    shippingTotal: '250.00',
    taxTotal: '0.00',
    discountTotal: '0.00',
    total: '2100.00',
    items: [],
    payments: [],
    shipments: [],
    returns: [],
    commissions: [],
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory = {
    id: 1,
    name: 'Herbal Teas',
    slug: 'herbal-teas',
    description: 'Fresh organic teas from Pakistan',
    parentId: null,
    parent: null,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { products: 5, subcategories: 0 },
  };

  const mockInventoryItem = {
    id: 'inv-op-1',
    productId: 'prod-op-1',
    sku: 'TEA-PSH-001',
    stockQuantity: 15,
    reservedQuantity: 2,
    lowStockThreshold: 5,
    location: 'Warehouse Lahore Bay-3',
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
  };

  const mockPayment = {
    id: 'pay-op-1',
    orderId: 'order-op-1',
    order: mockOrder,
    transactionReference: 'JC-PK-99201948',
    paymentMethod: 'JazzCash',
    amount: '2100.00',
    currency: 'PKR',
    status: PaymentStatus.PAID,
    failureReason: null,
    metadata: {},
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    user: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([mockCustomerUser, mockVendorUser]),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const identifier = where?.id || where?.OR?.[0]?.username || where?.OR?.[0]?.id;
        if (identifier === 'admin-op-id' || identifier === 'operational_admin') return Promise.resolve(mockNormalAdminUser);
        if (identifier === 'customer-op-id' || identifier === 'shopper_fatima') return Promise.resolve(mockCustomerUser);
        if (identifier === 'vendor-op-id' || identifier === 'lahore_spices') return Promise.resolve(mockVendorUser);
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'admin-op-id') return Promise.resolve(mockNormalAdminUser);
        if (where.id === 'customer-op-id') return Promise.resolve(mockCustomerUser);
        if (where.id === 'vendor-op-id') return Promise.resolve(mockVendorUser);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where: _where, data }) => {
        return Promise.resolve({ ...mockCustomerUser, ...data });
      }),
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { failedLoginAttempts: 0 } }),
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([mockAdminRole, mockCustomerRole, mockVendorRole]),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.code === 'ADMIN' || where.id === 2) return Promise.resolve(mockAdminRole);
        return Promise.resolve(null);
      }),
    },
    product: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockProduct]),
      findUnique: jest.fn().mockResolvedValue(mockProduct),
      update: jest.fn().mockResolvedValue(mockProduct),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    category: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockCategory]),
      findUnique: jest.fn().mockResolvedValue(mockCategory),
      create: jest.fn().mockResolvedValue(mockCategory),
      update: jest.fn().mockResolvedValue(mockCategory),
    },
    inventoryItem: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([mockInventoryItem]),
      findUnique: jest.fn().mockResolvedValue(mockInventoryItem),
      update: jest.fn().mockResolvedValue(mockInventoryItem),
    },
    inventoryLog: {
      create: jest.fn().mockResolvedValue({ id: 'inv-log-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    order: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          ...mockOrder,
          customer: {
            id: mockCustomerUser.id,
            firstName: mockCustomerUser.firstName,
            lastName: mockCustomerUser.lastName,
            email: mockCustomerUser.email,
            username: mockCustomerUser.username,
          },
          _count: { items: 1 },
        },
      ]),
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      update: jest.fn().mockResolvedValue(mockOrder),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: '150.00' } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    orderStatusHistory: {
      create: jest.fn().mockResolvedValue({ id: 'osh-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockPayment]),
      findUnique: jest.fn().mockResolvedValue(mockPayment),
      update: jest.fn().mockResolvedValue({ ...mockPayment, status: PaymentStatus.REFUNDED }),
    },
    sellerApproval: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    sellerPayout: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    orderReturn: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    productReview: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    adminNotification: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'log-123' }),
    },
    platformSetting: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    userSession: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Administration', code: 'ADMN' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Administration', code: 'ADMN' }),
    },
    $transaction: jest.fn().mockImplementation((args) => {
      if (Array.isArray(args)) return Promise.all(args);
      if (typeof args === 'function') return args(mockPrismaService);
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

  describe('1. Unauthenticated & Unauthorized Role Access Tests', () => {
    it('Unauthenticated request to admin dashboard returns 401', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .expect(401);
    });

    it('CUSTOMER role attempting admin access returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('x-user-id', 'customer-op-id')
        .expect(403);
    });

    it('VENDOR role attempting admin access returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('x-user-id', 'vendor-op-id')
        .expect(403);
    });

    it('CUSTOMER role attempting global search returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/search?q=test')
        .set('x-user-id', 'customer-op-id')
        .expect(403);
    });

    it('CUSTOMER role attempting Customer 360 returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/customers/customer-op-id/commerce')
        .set('x-user-id', 'customer-op-id')
        .expect(403);
    });

    it('CUSTOMER role attempting Seller 360 returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/sellers/vendor-op-id/commerce')
        .set('x-user-id', 'customer-op-id')
        .expect(403);
    });

    it('CUSTOMER role attempting stock adjustment returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch('/api/admin/inventory/inv-op-1/stock')
        .set('x-user-id', 'customer-op-id')
        .send({ stockQuantity: 50 })
        .expect(403);
    });
  });

  describe('2. Normal ADMIN Operational Access Allowed', () => {
    it('GET /api/admin/dashboard returns operational dashboard metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
    });

    it('GET /api/admin/users/customers returns customer list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/customers')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /api/admin/users/sellers returns sellers list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/sellers')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/admin/products returns catalog products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/products')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /api/admin/categories returns category tree', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/categories')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/admin/orders returns orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/admin/payments returns transactions ledger', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/payments')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/admin/audit-logs returns immutable audit log', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('PATCH /api/admin/inventory/:id/stock adjusts stock and creates audit record', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/inventory/inv-op-1/stock')
        .set('x-user-id', 'admin-op-id')
        .send({
          stockQuantity: 25,
          changeType: 'RESTOCK',
          reason: 'Received shipment',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('GET /api/admin/users/customers/:id/commerce returns customer commerce 360 data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/customers/customer-op-id/commerce')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('customer-op-id');
      expect(res.body.data.commerceSummary).toBeDefined();
      expect(res.body.data.commerceSummary.totalOrders).toBe(1);
    });

    it('GET /api/admin/users/sellers/:id/commerce returns seller commerce 360 data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/sellers/vendor-op-id/commerce')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('vendor-op-id');
      expect(res.body.data.commerceSummary).toBeDefined();
      expect(res.body.data.commerceSummary.totalProducts).toBe(1);
    });

    it('GET /api/admin/search?q=tea returns global search results across database', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/search?q=tea')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toBeDefined();
    });

    it('GET /api/admin/search with short query returns empty results without error', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/search?q=t')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toEqual([]);
    });

    it('GET /api/admin/profile returns self admin profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .set('x-user-id', 'admin-op-id')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('operational_admin');
    });
  });

  describe('3. Normal ADMIN Strictly Forbidden from Super Admin Governance Endpoints', () => {
    it('GET /api/admin/users/admins -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/admins')
        .set('x-user-id', 'admin-op-id')
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('POST /api/admin/users/admins -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/users/admins')
        .set('x-user-id', 'admin-op-id')
        .send({
          username: 'sneaky_admin',
          email: 'sneaky@tobetake.dev',
          password: 'Password123!',
          firstName: 'Sneaky',
          lastName: 'Admin',
          departmentId: 1,
          designation: 'Staff',
        })
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('GET /api/admin/roles-permissions/roles -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/roles-permissions/roles')
        .set('x-user-id', 'admin-op-id')
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('PUT /api/admin/roles-permissions -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/roles-permissions')
        .set('x-user-id', 'admin-op-id')
        .send({
          roleId: 2,
          permissionIds: [1, 2, 3],
        })
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('GET /api/admin/security/overview -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/security/overview')
        .set('x-user-id', 'admin-op-id')
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('GET /api/admin/settings -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set('x-user-id', 'admin-op-id')
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('PUT /api/admin/settings -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/settings')
        .set('x-user-id', 'admin-op-id')
        .send({
          settings: [{ key: 'platform_name', value: 'Hacked' }],
        })
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });

    it('POST /api/admin/commissions/config -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/commissions/config')
        .set('x-user-id', 'admin-op-id')
        .send({
          defaultRatePercent: 25,
        })
        .expect(403);

      expect(res.body.message).toMatch(/(Super Admin privilege required|Insufficient permissions)/);
    });
  });
});
