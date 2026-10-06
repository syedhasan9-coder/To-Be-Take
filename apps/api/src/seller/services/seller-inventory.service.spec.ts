import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { SellerInventoryService } from './seller-inventory.service';

describe('SellerInventoryService', () => {
  let service: SellerInventoryService;
  let prisma: {
    inventoryItem: {
      count: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    inventoryLog: {
      create: jest.Mock;
    };
    product: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      inventoryItem: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      inventoryLog: {
        create: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerInventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerInventoryService>(SellerInventoryService);
  });

  it('should prevent adjusting inventory for a product not owned by seller', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.adjustStock('seller-A', 'prod-owned-by-B', { stockQuantity: 20 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject negative stock values', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'prod-1',
      sellerId: 'seller-A',
      inventory: { id: 'inv-1', stockQuantity: 10 },
    });

    await expect(
      service.adjustStock('seller-A', 'prod-1', { stockQuantity: -5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should adjust stock and log mutation in transaction for valid seller product', async () => {
    const mockProduct = {
      id: 'prod-1',
      sellerId: 'seller-A',
      name: 'Organic Honey',
      sku: 'HONEY-01',
      categoryId: 1,
      category: { name: 'Grocery' },
      inventory: {
        id: 'inv-1',
        stockQuantity: 15,
        reservedQuantity: 2,
        lowStockThreshold: 5,
        location: 'Warehouse B',
      },
    };

    prisma.product.findFirst.mockResolvedValue(mockProduct);
    prisma.inventoryItem.update.mockResolvedValue({
      id: 'inv-1',
      productId: 'prod-1',
      sku: 'HONEY-01',
      stockQuantity: 40,
      reservedQuantity: 2,
      lowStockThreshold: 5,
      location: 'Warehouse B',
      updatedAt: new Date(),
    });

    const result = await service.adjustStock('seller-A', 'prod-1', {
      stockQuantity: 40,
      reason: 'Supplier delivery batch #89',
    });

    expect(result.stockQuantity).toBe(40);
    expect(result.availableQuantity).toBe(38);
    expect(prisma.inventoryLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inventoryItemId: 'inv-1',
          quantityChange: 25,
          previousQuantity: 15,
          newQuantity: 40,
        }),
      }),
    );
  });
});
