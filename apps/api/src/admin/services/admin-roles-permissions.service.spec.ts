import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { AdminRolesPermissionsService } from './admin-roles-permissions.service';

describe('AdminRolesPermissionsService', () => {
  let service: AdminRolesPermissionsService;
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
    username: 'admin_john',
    email: 'john@tobetake.dev',
    firstName: 'John',
    lastName: 'Admin',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['USERS_VIEW'],
  };

  const mockAdminRole = {
    id: 2,
    name: 'Admin',
    code: 'ADMIN',
    rolePermissions: [
      { permission: { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users' } },
    ],
  };

  const mockAllPermissions = [
    { id: 1, code: 'USERS_VIEW', name: 'View Users', category: 'Users', description: null },
    {
      id: 2,
      code: 'SETTINGS_MANAGE',
      name: 'Manage Settings',
      category: 'Settings',
      description: null,
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      userRole: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      permission: {
        findMany: jest.fn().mockResolvedValue(mockAllPermissions),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    };

    const mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRolesPermissionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminRolesPermissionsService>(AdminRolesPermissionsService);
    prisma = module.get(PrismaService);
    auditService = module.get(AdminAuditService);
  });

  it('should get role permissions', async () => {
    (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);

    const result = await service.getRolePermissions(2);

    expect(result.roleName).toBe('Admin');
    expect(result.permissions).toHaveLength(1);
    expect(result.allPermissions).toHaveLength(2);
  });

  it('should allow Super Admin to update role permissions and log audit', async () => {
    (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(mockAdminRole);

    const result = await service.updateRolePermissions(
      { roleId: 2, permissionIds: [1, 2] },
      mockSuperAdminUser,
    );

    expect(result).toBeDefined();
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLE_PERMISSIONS_UPDATED',
        targetType: 'Role',
      }),
    );
  });

  it('CRITICAL SECURITY: Normal Admin cannot update role permissions', async () => {
    await expect(
      service.updateRolePermissions({ roleId: 2, permissionIds: [1, 2] }, mockNormalAdminUser),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled();
  });

  it('should prevent stripping permissions from Super Admin role', async () => {
    (prisma.userRole.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Super Admin',
      code: 'SPADMIN',
    });

    await expect(
      service.updateRolePermissions({ roleId: 1, permissionIds: [] }, mockSuperAdminUser),
    ).rejects.toThrow(BadRequestException);
  });
});
