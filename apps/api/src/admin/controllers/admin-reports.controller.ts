import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ReportsData } from '@tobetake/shared-types';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminReportsService } from '../services/admin-reports.service';

@Controller('admin/reports')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get('export')
  @RequirePermissions('REPORTS_VIEW')
  async exportReports(@Res() res: Response): Promise<void> {
    const csvContent = await this.reportsService.exportReportsCsv();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `platform-reports-${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }

  @Get()
  @RequirePermissions('REPORTS_VIEW')
  async getReports(): Promise<ApiResponse<ReportsData>> {
    const data = await this.reportsService.getReports();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
