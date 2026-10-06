import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService, UserStatus, ProductStatus, OrderStatus } from '@tobetake/database';

jest.setTimeout(60000);

describe('Seller Portal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let sellerA: any;
  let sellerB: any;
  let buyer: any;
  let admin: any;
  let category: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    prisma = app.get(PrismaService);

    // Fetch test users from seeded database
    sellerA = await prisma.user.findFirst({
      where: { role: { code: 'VENDOR' }, username: 'vendor_apex', isDeleted: false },
    });
    if (!sellerA) {
      sellerA = await prisma.user.findFirst({
        where: { role: { code: 'VENDOR' }, isDeleted: false },
      });
    }

    sellerB = await prisma.user.findFirst({
      where: { role: { code: 'VENDOR' }, username: 'vendor_greenlife', isDeleted: false },
    });
    if (!sellerB) {
      sellerB = await prisma.user.findFirst({
        where: { role: { code: 'VENDOR' }, id: { not: sellerA?.id }, isDeleted: false },
      });
    }

    buyer = await prisma.user.findFirst({
      where: { role: { code: 'CUST' }, isDeleted: false },
    });
    admin = await prisma.user.findFirst({
      where: { role: { code: 'ADMIN' }, isDeleted: false },
    });
    category = await prisma.category.findFirst({
      where: { isActive: true },
    });
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Authentication, Security & Tenant Guard Isolation', () => {
    it('GET /api/seller/dashboard without credentials should return 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/seller/dashboard')
        .expect(401);
    });

    it('GET /api/seller/dashboard with Customer credentials should return 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/seller/dashboard')
        .set('Authorization', `Bearer ${buyer.id}`)
        .expect(403);
    });

    it('GET /api/seller/dashboard with Admin credentials should return 403 Forbidden (strict role isolation)', async () => {
      await request(app.getHttpServer())
        .get('/api/seller/dashboard')
        .set('Authorization', `Bearer ${admin.id}`)
        .expect(403);
    });

    it('GET /api/admin/dashboard with Seller credentials should return 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(403);
    });

    it('GET /api/seller/dashboard with valid Seller credentials should return 200 OK with KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/dashboard')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('kpis');
      expect(res.body.data).toHaveProperty('recentOrders');
      expect(res.body.data).toHaveProperty('topProducts');
      expect(res.body.data).toHaveProperty('lowStockAlerts');
      expect(typeof res.body.data.kpis.totalSales).toBe('number');
      expect(typeof res.body.data.kpis.netSales).toBe('number');
    });
  });

  describe('2. Seller Products CRUD, Categories & Horizontal Isolation', () => {
    let createdProductId: string;
    const testSku = `APEX-E2E-${Date.now()}`;

    it('Seller should be able to retrieve active categories for product creation', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/products/categories')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });

    it('Seller A should be able to create their own product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/seller/products')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          name: 'Apex Ultra Noise Cancelling Headphones',
          sku: testSku,
          description: 'Premium wireless headphones with spatial audio',
          price: 199.99,
          compareAtPrice: 249.99,
          costPrice: 95.0,
          categoryId: category?.id,
          stockQuantity: 45,
          lowStockThreshold: 10,
          location: 'Bay A4',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Ultra Noise Cancelling Headphones');
      expect(res.body.data.sku).toBe(testSku);
      expect(res.body.data.sellerId).toBe(sellerA.id);
      expect(res.body.data.stockQuantity).toBe(45);

      createdProductId = res.body.data.id;
    });

    it('Seller A cannot create product assigned to Seller B via payload sellerId injection', async () => {
      const malSku = `MAL-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/seller/products')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          name: 'Malicious Injected Product',
          sku: malSku,
          price: 99.0,
          sellerId: sellerB.id, // Attempt to inject sellerB
        });

      // Either rejected by validation pipe due to extra field or assigned to sellerA
      if (res.status === 201) {
        expect(res.body.data.sellerId).toBe(sellerA.id);
      } else {
        expect([400, 422]).toContain(res.status);
      }
    });

    it('Seller A can fetch their own product details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdProductId);
      expect(res.body.data.sellerId).toBe(sellerA.id);
    });

    it('Seller B CANNOT view Seller A product (returns 404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get(`/api/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${sellerB.id}`)
        .expect(404);
    });

    it('Seller B CANNOT update Seller A product (returns 404 Not Found)', async () => {
      await request(app.getHttpServer())
        .put(`/api/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${sellerB.id}`)
        .send({
          name: 'Hacked Title',
          price: 10.0,
        })
        .expect(404);
    });

    it('Seller B CANNOT delete Seller A product (returns 404 Not Found)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${sellerB.id}`)
        .expect(404);
    });

    it('Seller A can update their own product', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          price: 189.99,
          description: 'Updated description for headphones',
        })
        .expect(200);

      expect(res.body.data.price).toBe(189.99);
      expect(res.body.data.description).toBe('Updated description for headphones');
    });

    it('Seller A can toggle their own product status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/seller/products/${createdProductId}/status`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({ status: ProductStatus.INACTIVE })
        .expect(200);

      expect(res.body.data.status).toBe(ProductStatus.INACTIVE);
    });
  });

  describe('3. Seller Inventory Management & Stock Adjustment', () => {
    let inventoryItem: any;

    beforeAll(async () => {
      inventoryItem = await prisma.inventoryItem.findFirst({
        where: { product: { sellerId: sellerA.id, isDeleted: false } },
        include: { product: true },
      });
    });

    it('Seller A can view their inventory catalog', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/inventory')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach((item: any) => {
        expect(item.sellerId).toBe(sellerA.id);
      });
    });

    it('Seller A can adjust stock quantity', async () => {
      if (!inventoryItem) return;

      const targetStock = 88;
      const res = await request(app.getHttpServer())
        .patch(`/api/seller/inventory/${inventoryItem.productId}/stock`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          stockQuantity: targetStock,
          changeType: 'RESTOCK',
          reason: 'Received supplier shipment batch #90',
        })
        .expect(200);

      expect(res.body.data.stockQuantity).toBe(targetStock);

      // Verify in database
      const dbInv = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id },
      });
      expect(dbInv?.stockQuantity).toBe(targetStock);
    });

    it('Negative stock adjustment is rejected with 400 Bad Request', async () => {
      if (!inventoryItem) return;

      await request(app.getHttpServer())
        .patch(`/api/seller/inventory/${inventoryItem.productId}/stock`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          stockQuantity: -10,
        })
        .expect(400);
    });

    it('Seller B CANNOT adjust Seller A inventory (returns 404 Not Found)', async () => {
      if (!inventoryItem) return;

      await request(app.getHttpServer())
        .patch(`/api/seller/inventory/${inventoryItem.productId}/stock`)
        .set('Authorization', `Bearer ${sellerB.id}`)
        .send({
          stockQuantity: 100,
        })
        .expect(404);
    });
  });

  describe('4. Seller Orders, State Machine Transitions & Isolation', () => {
    let orderA: any;

    beforeAll(async () => {
      orderA = await prisma.order.findFirst({
        where: { items: { some: { sellerId: sellerA.id } } },
        include: { items: true },
      });
    });

    it('Seller A views only orders containing their items', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/orders')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('Seller A order detail returns only items belonging to Seller A', async () => {
      if (!orderA) return;

      const res = await request(app.getHttpServer())
        .get(`/api/seller/orders/${orderA.id}`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(orderA.id);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      res.body.data.items.forEach((item: any) => {
        expect(item.sellerId).toBe(sellerA.id);
      });
    });

    it('Seller B CANNOT view Seller A order if no Seller B items present', async () => {
      const exclusiveOrderA = await prisma.order.findFirst({
        where: {
          items: {
            some: { sellerId: sellerA.id },
            none: { sellerId: sellerB.id },
          },
        },
      });

      if (!exclusiveOrderA) return;

      await request(app.getHttpServer())
        .get(`/api/seller/orders/${exclusiveOrderA.id}`)
        .set('Authorization', `Bearer ${sellerB.id}`)
        .expect(404);
    });

    it('Order State Machine: Rejects invalid status transitions', async () => {
      // Create a dedicated order in DELIVERED status
      const deliveredOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-DEL-${Date.now()}`,
          customerId: buyer.id,
          status: OrderStatus.DELIVERED,
          subtotal: 50.0,
          total: 50.0,
          items: {
            create: {
              sellerId: sellerA.id,
              productName: 'Delivered Item',
              sku: `DEL-${Date.now()}`,
              quantity: 1,
              unitPrice: 50.0,
              totalPrice: 50.0,
            },
          },
        },
      });

      // Attempt invalid transition from DELIVERED -> PROCESSING
      await request(app.getHttpServer())
        .patch(`/api/seller/orders/${deliveredOrder.id}/status`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(400);

      // Attempt invalid transition from DELIVERED -> SHIPPED
      await request(app.getHttpServer())
        .patch(`/api/seller/orders/${deliveredOrder.id}/status`)
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({ status: OrderStatus.SHIPPED })
        .expect(400);
    });
  });

  describe('5. Seller Shipping Logistics & Returns', () => {
    it('Seller A can fetch their store shipments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/shipping')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('Seller A can fetch customer returns', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/returns')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('6. Seller Finance & Ledger Views', () => {
    it('Seller A can fetch earnings summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/finance/earnings')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.grossSales).toBe('number');
      expect(typeof res.body.data.platformFees).toBe('number');
      expect(typeof res.body.data.netEarnings).toBe('number');
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });

    it('Seller A can view commissions ledger', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/finance/commissions')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('Seller A can view payouts ledger', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/finance/payouts')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('7. Store Profile & Notifications', () => {
    it('Seller A can view and update their store profile via PUT and PATCH', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/api/seller/profile')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(getRes.body.data.id).toBe(sellerA.id);
      expect(getRes.body.data.roleCode).toBe('VENDOR');

      const updateRes = await request(app.getHttpServer())
        .put('/api/seller/profile')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          storeName: 'Apex Electronics & Tech Innovations',
          businessCategory: 'Electronics & Gadgets',
          firstName: 'Alexander',
          lastName: 'Wright',
        })
        .expect(200);

      expect(updateRes.body.data.storeName).toBe('Apex Electronics & Tech Innovations');

      const patchRes = await request(app.getHttpServer())
        .patch('/api/seller/profile')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .send({
          storeName: 'Apex Electronics & Tech Innovations',
        })
        .expect(200);

      expect(patchRes.body.data.storeName).toBe('Apex Electronics & Tech Innovations');
    });

    it('Seller A can view and mark notifications read', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/seller/notifications')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe('number');

      const markRes = await request(app.getHttpServer())
        .patch('/api/seller/notifications/read-all')
        .set('Authorization', `Bearer ${sellerA.id}`)
        .expect(200);

      expect(markRes.body.success).toBe(true);
    });
  });
});
