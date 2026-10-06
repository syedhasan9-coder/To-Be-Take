import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, ProductStatus } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminProductsService } from './admin-products.service';

describe('AdminProductsService', () => {
  let service: AdminProductsService;
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
    permissions: ['PRODUCTS_VIEW', 'PRODUCTS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      product: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'prod-1',
            sellerId: 'seller-1',
            categoryId: 1,
            name: 'Organic Herbal Tea',
            slug: 'organic-herbal-tea',
            sku: 'TEA-ORG-001',
            description: 'Organic calming blend',
            price: 24.99,
            compareAtPrice: 29.99,
            costPrice: 12.0,
            status: ProductStatus.ACTIVE,
            moderationNotes: null,
            images: ['https://example.com/tea.jpg'],
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            seller: {
              id: 'seller-1',
              username: 'vendor_apex',
              firstName: 'Apex',
              lastName: 'Goods',
              storeName: 'Apex Store',
            },
            category: { id: 1, name: 'Beverages' },
            inventory: { stockQuantity: 45, reservedQuantity: 5 },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'prod-1',
          sellerId: 'seller-1',
          categoryId: 1,
          name: 'Organic Herbal Tea',
          slug: 'organic-herbal-tea',
          sku: 'TEA-ORG-001',
          description: 'Organic calming blend',
          price: 24.99,
          compareAtPrice: 29.99,
          costPrice: 12.0,
          status: ProductStatus.ACTIVE,
          moderationNotes: null,
          images: ['https://example.com/tea.jpg'],
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: {
            id: 'seller-1',
            username: 'vendor_apex',
            firstName: 'Apex',
            lastName: 'Goods',
            storeName: 'Apex Store',
          },
          category: { id: 1, name: 'Beverages' },
          inventory: { stockQuantity: 45, reservedQuantity: 5, lowStockThreshold: 10, location: 'A-12' },
        }),
        create: jest.fn().mockResolvedValue({
          id: 'prod-2',
          name: 'New Product',
          slug: 'new-product',
          sku: 'NEW-001',
          price: 19.99,
          sellerId: 'seller-1',
        }),
        update: jest.fn().mockResolvedValue({ id: 'prod-1' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'seller-1' }),
      },
      inventoryItem: {
        create: jest.fn().mockResolvedValue({ id: 'inv-2' }),
      },
      inventoryLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-2' }),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminProductsService>(AdminProductsService);
  });

  it('should list products with inventory and seller relations', async () => {
    const result = await service.listProducts({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Organic Herbal Tea');
    expect(result.items[0].stockQuantity).toBe(45);
  });

  it('should moderate product status and record audit log', async () => {
    await service.moderateProduct(
      'prod-1',
      { status: ProductStatus.REJECTED, moderationNotes: 'Does not meet guidelines' },
      mockAdminUser,
    );

    expect(mockPrisma.product.update).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PRODUCT_MODERATED',
        targetType: 'Product',
      }),
    );
  });
});
