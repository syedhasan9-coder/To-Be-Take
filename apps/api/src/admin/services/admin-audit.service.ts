import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { AuditLogItem, PaginatedResult } from '@tobetake/shared-types';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

export interface RecordAuditParams {
  actor?: {
    id?: string | null;
    username?: string;
    email?: string;
    role?: string;
    roleCode?: string;
  };
  action: string;
  targetType: string;
  targetId?: string | null;
  status?: string;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an administrative action in the audit log.
   * Designed to be non-blocking and safe against crashing primary business logic.
   */
  async recordLog(params: RecordAuditParams): Promise<void> {
    try {
      const detailsString =
        typeof params.details === 'object' && params.details !== null
          ? JSON.stringify(params.details)
          : (params.details ?? null);

      await this.prisma.auditLog.create({
        data: {
          actorId: params.actor?.id ?? null,
          actorName:
            params.actor?.username ||
            (params.actor as unknown as { firstName?: string })?.firstName ||
            'System',
          actorEmail: params.actor?.email ?? 'system@tobetake.dev',
          actorRole: params.actor?.roleCode || params.actor?.role || 'SYSTEM',
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId ?? null,
          status: params.status ?? 'SUCCESS',
          details: detailsString,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });

      this.logger.log(
        `Audit log recorded: [${params.action}] by ${params.actor?.username || 'System'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record audit log: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  /**
   * Retrieves paginated audit logs with search, actor, action, target and date filtering.
   */
  async getAuditLogs(query: AuditLogQueryDto): Promise<PaginatedResult<AuditLogItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { action: { contains: s, mode: 'insensitive' } },
        { actorName: { contains: s, mode: 'insensitive' } },
        { actorEmail: { contains: s, mode: 'insensitive' } },
        { targetType: { contains: s, mode: 'insensitive' } },
        { targetId: { contains: s, mode: 'insensitive' } },
        { details: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.action && query.action.trim().length > 0) {
      where.action = query.action.trim();
    }

    if (query.actorRole && query.actorRole.trim().length > 0) {
      where.actorRole = query.actorRole.trim();
    }

    if (query.targetType && query.targetType.trim().length > 0) {
      where.targetType = query.targetType.trim();
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((log) => ({
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Exports filtered audit log entries as standard RFC 4180 CSV content.
   */
  async exportAuditLogsCsv(query: AuditLogQueryDto): Promise<string> {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { action: { contains: s, mode: 'insensitive' } },
        { actorName: { contains: s, mode: 'insensitive' } },
        { actorEmail: { contains: s, mode: 'insensitive' } },
        { targetType: { contains: s, mode: 'insensitive' } },
        { targetId: { contains: s, mode: 'insensitive' } },
        { details: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.action && query.action.trim().length > 0) {
      where.action = query.action.trim();
    }

    if (query.actorRole && query.actorRole.trim().length > 0) {
      where.actorRole = query.actorRole.trim();
    }

    if (query.targetType && query.targetType.trim().length > 0) {
      where.targetType = query.targetType.trim();
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const items = await this.prisma.auditLog.findMany({
      where,
      take: 10000,
      orderBy: { createdAt: 'desc' },
    });

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Redact potential passwords and auth tokens
      str = str.replace(/"password":\s*"[^"]+"/gi, '"password":"[REDACTED]"');
      str = str.replace(/"token":\s*"[^"]+"/gi, '"token":"[REDACTED]"');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Event ID',
      'Action',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Target Type',
      'Target ID',
      'Status',
      'IP Address',
      'User Agent',
      'Payload Details',
      'Timestamp',
    ];

    const rows = items.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.action),
      escapeCsv(log.actorName),
      escapeCsv(log.actorEmail),
      escapeCsv(log.actorRole),
      escapeCsv(log.targetType),
      escapeCsv(log.targetId),
      escapeCsv(log.status),
      escapeCsv(log.ipAddress),
      escapeCsv(log.userAgent),
      escapeCsv(log.details),
      escapeCsv(log.createdAt.toISOString()),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
