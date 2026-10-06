import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, AuditLogItem, PaginatedResult } from '@tobetake/shared-types';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminAuditService } from '../services/admin-audit.service';

@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminAuditLogsController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get('export')
  @RequirePermissions('AUDIT_LOGS_VIEW')
  async exportAuditLogs(@Query() query: AuditLogQueryDto, @Res() res: Response): Promise<void> {
    const csvContent = await this.auditService.exportAuditLogsCsv(query);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }

  @Get()
  @RequirePermissions('AUDIT_LOGS_VIEW')
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<ApiResponse<PaginatedResult<AuditLogItem>>> {
    const data = await this.auditService.getAuditLogs(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
