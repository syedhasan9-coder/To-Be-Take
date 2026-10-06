import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';
import { AdminSettingsService } from './admin-settings.service';

describe('AdminSettingsService', () => {
  let service: AdminSettingsService;
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

  const mockSettings = [
    {
      id: 1,
      key: 'platform_name',
      value: 'To Be Take Marketplace',
      category: 'GENERAL',
      isPublic: true,
      description: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      key: 'customer_registration_enabled',
      value: 'true',
      category: 'REGISTRATION',
      isPublic: true,
      description: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      key: 'maintenance_mode',
      value: 'false',
      category: 'MAINTENANCE',
      isPublic: true,
      description: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      platformSetting: {
        findMany: jest.fn().mockResolvedValue(mockSettings),
        upsert: jest.fn(),
      },
    };

    const mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminSettingsService>(AdminSettingsService);
    prisma = module.get(PrismaService);
    auditService = module.get(AdminAuditService);
  });

  it('should return grouped settings', async () => {
    const result = await service.getSettingsGrouped();
    expect(result.general).toHaveLength(1);
    expect(result.registration).toHaveLength(1);
    expect(result.maintenance).toHaveLength(1);
  });

  it('should update platform settings and log audit', async () => {
    (prisma.platformSetting.upsert as jest.Mock).mockResolvedValue({
      id: 3,
      key: 'maintenance_mode',
      value: 'true',
    });

    const result = await service.updateSettings(
      { settings: [{ key: 'maintenance_mode', value: 'true' }] },
      mockSuperAdminUser,
    );

    expect(result).toBeDefined();
    expect(prisma.platformSetting.upsert).toHaveBeenCalled();
    expect(auditService.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PLATFORM_SETTINGS_UPDATED',
        targetType: 'PlatformSetting',
      }),
    );
  });

  it('should return public settings for client onboarding', async () => {
    const result = await service.getPublicSettings();
    expect(result.platform_name).toBe('To Be Take Marketplace');
    expect(result.customer_registration_enabled).toBe('true');
  });
});
