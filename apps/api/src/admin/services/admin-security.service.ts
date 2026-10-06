import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { SecurityOverview, UserSessionItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminSecurityService {
  private readonly logger = new Logger(AdminSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Retrieves high-level security overview and active monitoring metrics.
   */
  async getSecurityOverview(): Promise<SecurityOverview> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeSessionsCount,
      totalLoginsToday,
      failedLoginsToday,
      lockedAccountsCount,
      recentLoginLogs,
      activeSessionsList,
      securitySettings,
    ] = await Promise.all([
      this.prisma.userSession.count({
        where: { isValid: true, expiresAt: { gt: new Date() } },
      }),
      this.prisma.auditLog.count({
        where: {
          action: { in: ['USER_LOGIN', 'ADMIN_LOGIN'] },
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.user.aggregate({
        _sum: { failedLoginAttempts: true },
      }),
      this.prisma.user.count({
        where: { isLocked: true, isDeleted: false },
      }),
      this.prisma.auditLog.findMany({
        where: {
          action: { in: ['USER_LOGIN', 'ADMIN_LOGIN', 'SESSION_REVOKED', 'FORCE_LOGOUT'] },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userSession.findMany({
        where: { isValid: true, expiresAt: { gt: new Date() } },
        take: 20,
        orderBy: { lastActivityAt: 'desc' },
        include: {
          user: {
            include: { role: true },
          },
        },
      }),
      this.prisma.platformSetting.findMany({
        where: { category: 'SECURITY' },
      }),
    ]);

    const settingsRecord: Record<string, string> = {};
    for (const s of securitySettings) {
      settingsRecord[s.key] = s.value;
    }

    const activeSessions: UserSessionItem[] = activeSessionsList.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.user.username,
      userEmail: s.user.email,
      userRole: s.user.role.name,
      sessionToken: s.sessionToken.substring(0, 8) + '...',
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceInfo: s.deviceInfo,
      isValid: s.isValid,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));

    return {
      activeSessionsCount: Math.max(activeSessionsCount, activeSessions.length),
      totalLoginsToday,
      failedLoginsToday: failedLoginsToday._sum.failedLoginAttempts || 0,
      lockedAccountsCount,
      recentLoginActivities: recentLoginLogs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        actorName: log.actorName,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        status: log.status,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      activeSessions,
      securitySettings: settingsRecord,
    };
  }

  /**
   * Revokes a specific user session.
   */
  async revokeSession(
    sessionId: string,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<{ success: boolean; message: string }> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { include: { role: true } },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ID '${sessionId}' not found.`);
    }

    // Backend protection: Normal admin cannot revoke Super Admin session
    if (session.user.role.code === 'SPADMIN' && currentAdmin.roleCode !== 'SPADMIN') {
      throw new ForbiddenException(
        'Super Admin account protection: Standard administrators cannot terminate Super Admin sessions.',
      );
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'SESSION_REVOKED',
      targetType: 'UserSession',
      targetId: sessionId,
      status: 'SUCCESS',
      details: {
        targetUsername: session.user.username,
        targetUserId: session.userId,
      },
    });

    return { success: true, message: 'Session successfully revoked.' };
  }

  /**
   * Force logs out a user by invalidating all active sessions.
   */
  async forceLogoutUser(
    userId: string,
    currentAdmin: AuthenticatedAdminUser,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    // Backend protection: Normal admin cannot force logout Super Admin
    if (user.role.code === 'SPADMIN' && currentAdmin.roleCode !== 'SPADMIN') {
      throw new ForbiddenException(
        'Super Admin account protection: Standard administrators cannot force logout Super Admin accounts.',
      );
    }

    await this.prisma.userSession.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });

    await this.auditService.recordLog({
      actor: currentAdmin,
      action: 'FORCE_LOGOUT',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS',
      details: {
        targetUsername: user.username,
        targetRole: user.role.code,
      },
    });

    return {
      success: true,
      message: `All active sessions for '${user.username}' have been terminated.`,
    };
  }
}
