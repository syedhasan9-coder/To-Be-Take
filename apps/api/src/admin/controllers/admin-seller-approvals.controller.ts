import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiResponse, PaginatedResult, SellerApprovalItem } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ReviewSellerApprovalDto } from '../dto/review-seller-approval.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminSellerApprovalsService } from '../services/admin-seller-approvals.service';

@Controller('admin/seller-approvals')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminSellerApprovalsController {
  constructor(private readonly approvalsService: AdminSellerApprovalsService) {}

  @Get()
  @RequirePermissions('SELLERS_VIEW')
  async listApprovals(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponse<PaginatedResult<SellerApprovalItem>>> {
    const data = await this.approvalsService.listApprovals({ status, search, page, limit });
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('SELLERS_VIEW')
  async getApprovalDetails(@Param('id') id: string): Promise<ApiResponse<SellerApprovalItem>> {
    const data = await this.approvalsService.getApprovalDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/review')
  @RequirePermissions('SELLERS_APPROVE')
  @AdminMutationThrottle()
  async reviewApproval(
    @Param('id') id: string,
    @Body() dto: ReviewSellerApprovalDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<SellerApprovalItem>> {
    const data = await this.approvalsService.reviewApproval(id, dto, admin);
    return {
      success: true,
      message: `Seller onboarding status changed to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/approve')
  @RequirePermissions('SELLERS_APPROVE')
  @AdminMutationThrottle()
  async approveSeller(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<SellerApprovalItem>> {
    const data = await this.approvalsService.reviewApproval(
      id,
      { status: 'APPROVED', notes: 'Approved by administrator' },
      admin,
    );
    return {
      success: true,
      message: 'Seller successfully approved',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/reject')
  @RequirePermissions('SELLERS_APPROVE')
  @AdminMutationThrottle()
  async rejectSeller(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<SellerApprovalItem>> {
    const data = await this.approvalsService.reviewApproval(
      id,
      { status: 'REJECTED', reason: reason || 'Application did not meet marketplace requirements' },
      admin,
    );
    return {
      success: true,
      message: 'Seller onboarding rejected',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
