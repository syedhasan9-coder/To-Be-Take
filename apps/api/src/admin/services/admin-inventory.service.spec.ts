import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminInventoryService } from './admin-inventory.service';

describe('AdminInventoryService', () => {
  let service: AdminInventoryService;
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
    permissions: ['INVENTORY_VIEW', 'INVENTORY_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      inventoryItem: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            productId: 'prod-1',
            sku: 'MUG-001',
            stockQuantity: 4,
            reservedQuantity: 1,
            lowStockThreshold: 5,
            location: 'Shelf B-3',
            updatedAt: new Date(),
            product: {
              name: 'Ceramic Planter',
              categoryId: 2,
              sellerId: 'seller-1',
              category: { name: 'Home' },
              seller: { firstName: 'Green', lastName: 'Life', storeName: 'Green Life' },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'inv-1',
          productId: 'prod-1',
          sku: 'MUG-001',
          stockQuantity: 4,
          reservedQuantity: 1,
          lowStockThreshold: 5,
          location: 'Shelf B-3',
          updatedAt: new Date(),
          product: {
            name: 'Ceramic Planter',
            categoryId: 2,
            sellerId: 'seller-1',
            category: { name: 'Home' },
            seller: { firstName: 'Green', lastName: 'Life', storeName: 'Green Life' },
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'inv-1',
          productId: 'prod-1',
          sku: 'MUG-001',
          stockQuantity: 20,
          reservedQuantity: 1,
          lowStockThreshold: 5,
          location: 'Shelf B-3',
          updatedAt: new Date(),
        }),
      },
      inventoryLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            inventoryItemId: 'inv-1',
            changeType: 'RESTOCK',
            quantityChange: 16,
            previousQuantity: 4,
            newQuantity: 20,
            reason: 'Restocked by supplier',
            actorId: 'admin-uuid-1',
            createdAt: new Date(),
          },
        ]),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminInventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminInventoryService>(AdminInventoryService);
  });

  it('should list inventory and flag low stock items', async () => {
    const result = await service.listInventory({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.items[0].isLowStock).toBe(true);
    expect(result.items[0].availableQuantity).toBe(3);
  });

  it('should update stock and record audit log', async () => {
    const updated = await service.updateStock(
      'inv-1',
      { stockQuantity: 20, reason: 'Restocked by supplier' },
      mockAdminUser,
    );

    expect(mockPrisma.inventoryItem.update).toHaveBeenCalled();
    expect(mockPrisma.inventoryLog.create).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVENTORY_STOCK_UPDATED',
        targetType: 'InventoryItem',
      }),
    );
  });
});
