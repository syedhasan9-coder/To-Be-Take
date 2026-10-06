import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaService, ProductStatus } from '@tobetake/database';
import { SellerProductsService } from './seller-products.service';

describe('SellerProductsService', () => {
  let service: SellerProductsService;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    category: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    inventoryItem: {
      create: jest.Mock;
    };
    inventoryLog: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      inventoryItem: {
        create: jest.fn(),
      },
      inventoryLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerProductsService>(SellerProductsService);
  });

  it('should list products strictly filtered by sellerId', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        sellerId: 'seller-A',
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        sku: 'WH-001',
        description: 'Noise cancelling',
        price: new Prisma.Decimal(99.99),
        compareAtPrice: null,
        costPrice: null,
        status: ProductStatus.ACTIVE,
        images: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { name: 'Electronics' },
        inventory: {
          id: 'inv-1',
          stockQuantity: 50,
          reservedQuantity: 5,
          lowStockThreshold: 10,
          location: 'A1',
          updatedAt: new Date(),
        },
      },
    ]);

    const result = await service.getProducts('seller-A', { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Wireless Headphones');
    expect(result.items[0].stockQuantity).toBe(50);
  });

  it('should prevent Seller A from fetching Seller B product', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.getProductById('seller-A', 'prod-belonging-to-seller-B'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject duplicate SKU on product creation', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'existing-prod', sku: 'DUPLICATE-SKU' });

    await expect(
      service.createProduct('seller-A', {
        name: 'New Item',
        sku: 'DUPLICATE-SKU',
        price: 25.0,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should automatically assign sellerId from session when creating product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    prisma.product.create.mockResolvedValue({
      id: 'new-prod-id',
      sellerId: 'seller-A',
      sku: 'UNIQUE-SKU',
    });
    prisma.inventoryItem.create.mockResolvedValue({ id: 'inv-id' });
    prisma.product.findUniqueOrThrow.mockResolvedValue({
      id: 'new-prod-id',
      sellerId: 'seller-A',
      name: 'Unique Item',
      sku: 'UNIQUE-SKU',
      price: new Prisma.Decimal(50.0),
      status: ProductStatus.ACTIVE,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.product.findFirst.mockResolvedValue({
      id: 'new-prod-id',
      sellerId: 'seller-A',
      name: 'Unique Item',
      sku: 'UNIQUE-SKU',
      price: new Prisma.Decimal(50.0),
      status: ProductStatus.ACTIVE,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createProduct('seller-A', {
      name: 'Unique Item',
      sku: 'UNIQUE-SKU',
      price: 50.0,
      stockQuantity: 20,
    });

    expect(result.id).toBe('new-prod-id');
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 'seller-A',
        }),
      }),
    );
  });

  it('should return active categories for seller product creation', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 1, name: 'Electronics', slug: 'electronics', description: 'Gadgets' },
      { id: 2, name: 'Home & Living', slug: 'home-living', description: 'Decor' },
    ]);

    const categories = await service.getCategories();
    expect(categories.length).toBe(2);
    expect(categories[0].name).toBe('Electronics');
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  });
});
