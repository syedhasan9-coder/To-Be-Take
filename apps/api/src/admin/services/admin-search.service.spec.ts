import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminSearchService } from './admin-search.service';

describe('AdminSearchService', () => {
  let service: AdminSearchService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminSearchService>(AdminSearchService);
  });

  it('should return empty results for queries shorter than 2 characters', async () => {
    const res1 = await service.search('');
    expect(res1.results).toEqual([]);
    expect(res1.query).toBe('');

    const res2 = await service.search('a');
    expect(res2.results).toEqual([]);
    expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
  });

  it('should search across orders, customers, sellers, and products', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: 'ord-123',
        orderNumber: 'ORD-10021',
        total: '149.99',
        status: 'DELIVERED',
        createdAt: new Date('2026-03-01'),
        customer: { firstName: 'Fatima', lastName: 'Khan', email: 'fatima@example.pk' },
      },
    ]);

    mockPrisma.user.findMany.mockImplementation(({ where }: any) => {
      const roleCodes = Array.isArray(where?.role?.code?.in)
        ? where.role.code.in
        : [where?.role?.code];
      if (roleCodes.includes('CUST') || roleCodes.includes('CUSTOMER')) {
        return Promise.resolve([
          {
            id: 'cust-456',
            firstName: 'Bilal',
            lastName: 'Ahmed',
            email: 'bilal@example.pk',
            username: 'bilalahmed',
            status: 'ACTIVE',
            role: { code: 'CUST', name: 'Buyer' },
          },
        ]);
      }
      if (roleCodes.includes('VENDOR') || roleCodes.includes('VEND')) {
        return Promise.resolve([
          {
            id: 'vend-789',
            firstName: 'Sarah',
            lastName: 'Green',
            email: 'sarah@store.com',
            username: 'greenstore',
            storeName: 'Green Life Store',
            status: 'ACTIVE',
            role: { code: 'VENDOR', name: 'Vendor' },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-101',
        name: 'Monstera Deliciosa Plant',
        sku: 'PLANT-MON-01',
        price: 34.5,
        isActive: true,
        category: { name: 'Indoor Plants' },
      },
    ]);

    const result = await service.search('green');
    expect(result.query).toBe('green');
    expect(result.results.length).toBe(4);

    // Verify Order result
    const orderRes = result.results.find((r: any) => r.type === 'order');
    expect(orderRes).toBeDefined();
    expect(orderRes?.id).toBe('ord-123');
    expect(orderRes?.title).toBe('ORD-10021');
    expect(orderRes?.url).toBe('/admin/orders/ord-123');

    // Verify Customer result
    const customerRes = result.results.find((r: any) => r.type === 'customer');
    expect(customerRes).toBeDefined();
    expect(customerRes?.id).toBe('cust-456');
    expect(customerRes?.title).toBe('Bilal Ahmed');
    expect(customerRes?.url).toBe('/admin/users/customers/cust-456');

    // Verify Seller result
    const sellerRes = result.results.find((r: any) => r.type === 'seller');
    expect(sellerRes).toBeDefined();
    expect(sellerRes?.id).toBe('vend-789');
    expect(sellerRes?.title).toBe('Green Life Store');
    expect(sellerRes?.url).toBe('/admin/users/sellers/vend-789');

    // Verify Product result
    const prodRes = result.results.find((r: any) => r.type === 'product');
    expect(prodRes).toBeDefined();
    expect(prodRes?.id).toBe('prod-101');
    expect(prodRes?.title).toBe('Monstera Deliciosa Plant');
    expect(prodRes?.url).toBe('/admin/products/prod-101');
  });

  it('should not expose sensitive user fields in results', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'cust-1',
        firstName: 'Secret',
        lastName: 'User',
        email: 'secret@test.com',
        username: 'secretuser',
        status: 'ACTIVE',
        passwordHash: 'SUPER_SECRET_HASH',
        role: { code: 'CUST', name: 'Buyer' },
      },
    ]);

    const res = await service.search('secret');
    const cust = res.results[0];
    expect(cust).toBeDefined();
    expect((cust as any).passwordHash).toBeUndefined();
    expect(JSON.stringify(cust)).not.toContain('SUPER_SECRET_HASH');
  });
});
