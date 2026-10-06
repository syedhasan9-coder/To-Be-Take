import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminCategoriesService } from './admin-categories.service';

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;
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
    permissions: ['CATEGORIES_VIEW', 'CATEGORIES_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Home & Living',
            slug: 'home-living',
            description: 'Decor and furniture',
            parentId: null,
            isActive: true,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            parent: null,
            _count: { products: 15, subcategories: 2 },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Home & Living',
          slug: 'home-living',
          description: 'Decor and furniture',
          parentId: null,
          isActive: true,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: null,
          _count: { products: 15, subcategories: 2 },
        }),
        create: jest.fn().mockResolvedValue({
          id: 2,
          name: 'Kitchenware',
          slug: 'kitchenware',
          parentId: 1,
          isActive: true,
          displayOrder: 0,
        }),
        update: jest.fn().mockResolvedValue({
          id: 1,
          isActive: false,
        }),
      },
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminCategoriesService>(AdminCategoriesService);
  });

  it('should list categories with product and subcategory counts', async () => {
    const list = await service.listCategories({});
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Home & Living');
    expect(list[0].productCount).toBe(15);
  });

  it('should toggle category active status', async () => {
    const result = await service.toggleCategoryStatus(1, mockAdminUser);
    expect(mockPrisma.category.update).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CATEGORY_STATUS_TOGGLED',
        targetType: 'Category',
      }),
    );
  });
});
