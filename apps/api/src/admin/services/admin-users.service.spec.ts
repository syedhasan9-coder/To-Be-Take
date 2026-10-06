import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, UserStatus } from '@tobetake/database';
import { PasswordService } from '../../common/services/password.service';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AdminAuditService>;

  const mockSuperAdminUser: AuthenticatedAdminUser = {
    id: 'spadmin-uuid',
    username: 'superadmin',
    email: 'superadmin@tobetake.dev',
    firstName: 'Super',
    lastName: 'Admin',
    roleId: 1,
    role: 'Super Admin',
    roleCode: 'SPADMIN',
    permissions: ['*'],
  };

  const mockNormalAdminUser: AuthenticatedAdminUser = {
    id: 'admin-uuid',
    username: 'admin_tariq',
    email: 'tariq@tobetake.dev',
    firstName: 'Tariq',
    lastName: 'Admin',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['USERS_VIEW', 'USERS_SUSPEND', 'ADMINS_MANAGE'],
  };

  const mockCustomerDbUser = {
    id: 'cust-uuid',
    username: 'cust_fatima',
    email: 'fatima@tobetake.dev',
    firstName: 'Fatima',
    lastName: 'Khan',
    roleId: 4,
    role: { id: 4, name: 'Buyer', code: 'CUST' },
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: false,
    isLocked: false,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  const mockSuperAdminDbUser = {
    id: 'spadmin-target-uuid',
    username: 'chief_superadmin',
    email: 'chief@tobetake.dev',
    firstName: 'Chief',
    lastName: 'SuperAdmin',
    roleId: 1,
    role: { id: 1, name: 'Super Admin', code: 'SPADMIN' },
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isMobileVerified: true,
    isLocked: false,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
      },
      userRole: {
        findUnique: jest.fn(),
      },
    };

    const mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const mockPassword = {
      hash: jest.fn().mockResolvedValue('hashed_pw_123'),
      compare: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
        { provide: PasswordService, useValue: mockPassword },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    prisma = module.get(PrismaService);
    auditService = module.get(AdminAuditService);
  });

  it('should list users with pagination and role filters', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockCustomerDbUser]);

    const result = await service.listUsers(['CUST'], {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].username).toBe('cust_fatima');
    expect(result.items[0].roleCode).toBe('CUST');
  });

  it('should update customer status and record an audit log', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCustomerDbUser);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockCustomerDbUser,
      status: UserStatus.SUSPENDED,
    });

    const result = await service.updateUserStatus(
      'cust-uuid',
      { status: UserStatus.SUSPENDED, reason: 'Test suspension' },
      mockSuperAdminUser,
    );

    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_STATUS_SUSPENDED',
        targetType: 'User',
      }),
    );
  });

  it('CRITICAL SECURITY: Normal ADMIN cannot suspend or modify Super Admin account', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSuperAdminDbUser);

    await expect(
      service.updateUserStatus(
        'spadmin-target-uuid',
        { status: UserStatus.SUSPENDED },
        mockNormalAdminUser,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should allow Super Admin to create a new Admin user and record audit log', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.department.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Operations' });
    (prisma.userRole.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      name: 'Admin',
      code: 'ADMIN',
    });
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-admin-id',
      username: 'new_admin',
      email: 'new_admin@tobetake.dev',
      firstName: 'New',
      lastName: 'Admin',
      roleId: 2,
      role: { id: 2, name: 'Admin', code: 'ADMIN' },
      departmentId: 1,
      department: { id: 1, name: 'Operations' },
      designation: 'Operations Specialist',
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isMobileVerified: false,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createAdmin(
      {
        username: 'new_admin',
        email: 'new_admin@tobetake.dev',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Admin',
        departmentId: 1,
        designation: 'Operations Specialist',
      },
      mockSuperAdminUser,
    );

    expect(result.username).toBe('new_admin');
    expect(result.roleCode).toBe('ADMIN');
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_CREATED',
        targetType: 'Admin',
      }),
    );
  });
});
