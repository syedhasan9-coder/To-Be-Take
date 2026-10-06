import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiResponse, SecurityOverview } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SuperAdminOnlyGuard } from '../guards/super-admin-only.guard';
import { AdminSecurityService } from '../services/admin-security.service';

@Controller('admin/security')
@UseGuards(AdminAuthGuard, SuperAdminOnlyGuard, PermissionsGuard)
export class AdminSecurityController {
  constructor(private readonly securityService: AdminSecurityService) {}

  @Get('overview')
  @RequirePermissions('SECURITY_VIEW')
  async getSecurityOverview(): Promise<ApiResponse<SecurityOverview>> {
    const data = await this.securityService.getSecurityOverview();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('sessions/revoke')
  @RequirePermissions('SECURITY_MANAGE')
  @AdminMutationThrottle()
  async revokeSession(
    @Body('sessionId') sessionId: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.securityService.revokeSession(sessionId, admin);
    return {
      success: true,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('users/:userId/force-logout')
  @RequirePermissions('SECURITY_MANAGE')
  @AdminMutationThrottle()
  async forceLogoutUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.securityService.forceLogoutUser(userId, admin);
    return {
      success: true,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
