import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  let service: AdminAuditService;
  let prisma: jest.Mocked<PrismaService>;

  const mockAuditLogs = [
    {
      id: 'log-1',
      actorId: 'admin-1',
      actorName: 'admin_user',
      actorEmail: 'admin@tobetake.dev',
      actorRole: 'ADMIN',
      action: 'SELLER_APPROVED',
      targetType: 'SellerApproval',
      targetId: 'seller-1',
      status: 'SUCCESS',
      details: JSON.stringify({ notes: 'Verified documents' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date('2026-09-20T10:00:00Z'),
    },
    {
      id: 'log-2',
      actorId: 'spadmin-1',
      actorName: 'superadmin',
      actorEmail: 'superadmin@tobetake.dev',
      actorRole: 'SPADMIN',
      action: 'SETTINGS_UPDATED',
      targetType: 'PlatformSetting',
      targetId: 'platform_name',
      status: 'SUCCESS',
      details: JSON.stringify({ password: 'secretpassword123', value: 'New Name' }),
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      createdAt: new Date('2026-09-21T12:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'new-log-id' }),
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue(mockAuditLogs),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminAuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AdminAuditService>(AdminAuditService);
    prisma = module.get(PrismaService);
  });

  it('should record an audit log successfully', async () => {
    await service.recordLog({
      actor: {
        id: 'admin-1',
        username: 'admin_user',
        email: 'admin@tobetake.dev',
        roleCode: 'ADMIN',
      },
      action: 'USER_SUSPENDED',
      targetType: 'User',
      targetId: 'user-99',
      details: { reason: 'Terms violation' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'admin-1',
        actorName: 'admin_user',
        action: 'USER_SUSPENDED',
        targetType: 'User',
        targetId: 'user-99',
      }),
    });
  });

  it('should get paginated audit logs with search filter', async () => {
    const result = await service.getAuditLogs({ search: 'SELLER', page: 1, limit: 10 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalled();
  });

  it('should export audit logs as formatted RFC 4180 CSV with redacted credentials', async () => {
    const csv = await service.exportAuditLogsCsv({ search: '', page: 1, limit: 10 });

    expect(csv).toContain(
      'Event ID,Action,Actor Name,Actor Email,Actor Role,Target Type,Target ID,Status,IP Address,User Agent,Payload Details,Timestamp',
    );
    expect(csv).toContain('"log-1"');
    expect(csv).toContain('"SELLER_APPROVED"');
    expect(csv).toContain('"superadmin"');
    // Verify password in details was redacted
    expect(csv).not.toContain('secretpassword123');
    expect(csv).toContain('[REDACTED]');
  });
});
