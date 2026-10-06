import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiResponse, PermissionItem, RolePermissionsResponse } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { SuperAdminOnlyGuard } from '../guards/super-admin-only.guard';
import { AdminRolesPermissionsService } from '../services/admin-roles-permissions.service';

@Controller('admin/roles-permissions')
@UseGuards(AdminAuthGuard, SuperAdminOnlyGuard)
export class AdminRolesPermissionsController {
  constructor(private readonly rolesPermissionsService: AdminRolesPermissionsService) {}

  @Get('roles')
  async getRoles(): Promise<ApiResponse<unknown>> {
    const data = await this.rolesPermissionsService.getRoles();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('permissions')
  async getAllPermissions(): Promise<ApiResponse<PermissionItem[]>> {
    const data = await this.rolesPermissionsService.getAllPermissions();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':roleId')
  async getRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<ApiResponse<RolePermissionsResponse>> {
    const data = await this.rolesPermissionsService.getRolePermissions(roleId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put()
  @UseGuards(SuperAdminOnlyGuard)
  @AdminMutationThrottle()
  async updateRolePermissions(
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<RolePermissionsResponse>> {
    const data = await this.rolesPermissionsService.updateRolePermissions(dto, admin);
    return {
      success: true,
      message: 'Role permissions updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
