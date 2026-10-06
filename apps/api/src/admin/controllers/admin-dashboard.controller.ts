import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiResponse, SuperAdminDashboardData } from '@tobetake/shared-types';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  async getDashboard(): Promise<ApiResponse<SuperAdminDashboardData>> {
    const data = await this.dashboardService.getDashboardData();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
