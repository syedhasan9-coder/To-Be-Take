import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let departmentsService: DepartmentsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockDepartments = [
    {
      id: 1,
      name: 'Administration',
      code: 'ADMN',
      description: 'Executive operations',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Vendor Management',
      code: 'VEND',
      description: 'Vendor operations',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      department: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    departmentsService = module.get<DepartmentsService>(DepartmentsService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(departmentsService).toBeDefined();
  });

  it('should return all departments ordered by id', async () => {
    (prismaService.department.findMany as jest.Mock).mockResolvedValue(mockDepartments);

    const result = await departmentsService.findAll();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Administration');
    expect(result[1].name).toBe('Vendor Management');
    expect(prismaService.department.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    });
  });

  it('should return a department by id', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(mockDepartments[0]);

    const result = await departmentsService.findById(1);

    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe('Administration');
  });

  it('should return null if department is not found', async () => {
    (prismaService.department.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await departmentsService.findById(999);

    expect(result).toBeNull();
  });
});
