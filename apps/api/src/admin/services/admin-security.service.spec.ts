import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { AdminSecurityService } from './admin-security.service';

describe('AdminSecurityService', () => {
  let service: AdminSecurityService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AdminAuditService>;

  const mockNormalAdminUser: AuthenticatedAdminUser = {
    id: 'admin-uuid',
    username: 'admin_tariq',
    email: 'tariq@tobetake.dev',
    firstName: 'Tariq',
    lastName: 'Admin',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['SECURITY_VIEW', 'SECURITY_MANAGE'],
  };

  const mockCustomerSession = {
    id: 'session-1',
    userId: 'cust-uuid',
    sessionToken: 'token-1234567890',
    isValid: true,
    expiresAt: new Date(Date.now() + 3600000),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    user: {
      id: 'cust-uuid',
      username: 'cust_fatima',
      email: 'fatima@tobetake.dev',
      role: { id: 4, name: 'Buyer', code: 'CUST' },
    },
  };

  const mockSuperAdminSession = {
    id: 'session-spadmin',
    userId: 'spadmin-uuid',
    sessionToken: 'token-superadmin',
    isValid: true,
    expiresAt: new Date(Date.now() + 3600000),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    user: {
      id: 'spadmin-uuid',
      username: 'superadmin',
      email: 'superadmin@tobetake.dev',
      role: { id: 1, name: 'Super Admin', code: 'SPADMIN' },
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      userSession: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([mockCustomerSession]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'session-1', isValid: false }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      auditLog: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { failedLoginAttempts: 3 } }),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
      platformSetting: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSecurityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminSecurityService>(AdminSecurityService);
    prisma = module.get(PrismaService);
    auditService = module.get(AdminAuditService);
  });

  it('should return security overview metrics', async () => {
    const result = await service.getSecurityOverview();
    expect(result.activeSessionsCount).toBeGreaterThan(0);
    expect(result.totalLoginsToday).toBe(12);
    expect(result.failedLoginsToday).toBe(3);
    expect(result.activeSessions).toHaveLength(1);
  });

  it('should revoke a session and log audit', async () => {
    (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockCustomerSession);

    const result = await service.revokeSession('session-1', mockNormalAdminUser);

    expect(result.success).toBe(true);
    expect(prisma.userSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { isValid: false },
    });
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SESSION_REVOKED',
        targetType: 'UserSession',
      }),
    );
  });

  it('CRITICAL SECURITY: Normal Admin cannot revoke Super Admin session', async () => {
    (prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSuperAdminSession);

    await expect(service.revokeSession('session-spadmin', mockNormalAdminUser)).rejects.toThrow(
      ForbiddenException,
    );

    expect(prisma.userSession.update).not.toHaveBeenCalled();
  });
});
