import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, OrderReturnItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ReturnQueryDto, ReviewReturnDto } from '../dto/return.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminReturnsService } from '../services/admin-returns.service';

@Controller('admin/returns')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminReturnsController {
  constructor(private readonly returnsService: AdminReturnsService) {}

  @Get()
  @RequirePermissions('RETURNS_VIEW')
  async listReturns(
    @Query() query: ReturnQueryDto,
  ): Promise<ApiResponse<PaginatedResult<OrderReturnItem>>> {
    const data = await this.returnsService.listReturns(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('RETURNS_VIEW')
  async getReturnDetails(@Param('id') id: string): Promise<ApiResponse<OrderReturnItem>> {
    const data = await this.returnsService.getReturnDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/review')
  @RequirePermissions('RETURNS_MANAGE')
  @AdminMutationThrottle()
  async reviewReturn(
    @Param('id') id: string,
    @Body() dto: ReviewReturnDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<OrderReturnItem>> {
    const data = await this.returnsService.reviewReturn(id, dto, admin);
    return {
      success: true,
      message: `Return request status updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
