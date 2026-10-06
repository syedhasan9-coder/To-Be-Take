import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiResponse,
  CommissionRecordItem,
  CommissionSummaryData,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { CommissionQueryDto, UpdateCommissionRateDto } from '../dto/commission.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SuperAdminOnlyGuard } from '../guards/super-admin-only.guard';
import { AdminCommissionsService } from '../services/admin-commissions.service';

@Controller('admin/commissions')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminCommissionsController {
  constructor(private readonly commissionsService: AdminCommissionsService) {}

  @Get()
  @RequirePermissions('COMMISSIONS_VIEW')
  async listCommissions(
    @Query() query: CommissionQueryDto,
  ): Promise<ApiResponse<PaginatedResult<CommissionRecordItem>>> {
    const data = await this.commissionsService.listCommissions(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('summary')
  @RequirePermissions('COMMISSIONS_VIEW')
  async getCommissionSummary(): Promise<ApiResponse<CommissionSummaryData>> {
    const data = await this.commissionsService.getCommissionSummary();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  @RequirePermissions('COMMISSIONS_VIEW')
  async getCommissionConfig(): Promise<ApiResponse<CommissionSummaryData>> {
    const data = await this.commissionsService.getCommissionSummary();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('rate')
  @UseGuards(SuperAdminOnlyGuard)
  @RequirePermissions('COMMISSIONS_MANAGE')
  async updateCommissionRate(
    @Body() dto: UpdateCommissionRateDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<CommissionSummaryData>> {
    const data = await this.commissionsService.updateDefaultCommissionRate(dto, admin);
    return {
      success: true,
      message: `Default platform commission rate set to ${dto.defaultRate}%`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('config')
  @UseGuards(SuperAdminOnlyGuard)
  @RequirePermissions('COMMISSIONS_MANAGE')
  async updateCommissionConfig(
    @Body() body: any,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<CommissionSummaryData>> {
    const rate = body.defaultRate ?? body.defaultRatePercent ?? 10;
    const data = await this.commissionsService.updateDefaultCommissionRate({ defaultRate: Number(rate) }, admin);
    return {
      success: true,
      message: `Default platform commission rate set to ${rate}%`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
