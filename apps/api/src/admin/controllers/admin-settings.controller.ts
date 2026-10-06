import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiResponse, PlatformSettingsGrouped } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SuperAdminOnlyGuard } from '../guards/super-admin-only.guard';
import { AdminSettingsService } from '../services/admin-settings.service';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get('public')
  async getPublicSettings(): Promise<ApiResponse<Record<string, string>>> {
    const data = await this.settingsService.getPublicSettings();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(AdminAuthGuard, SuperAdminOnlyGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_VIEW')
  async getSettings(): Promise<ApiResponse<PlatformSettingsGrouped>> {
    const data = await this.settingsService.getSettingsGrouped();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put()
  @UseGuards(AdminAuthGuard, SuperAdminOnlyGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  @AdminMutationThrottle()
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<PlatformSettingsGrouped>> {
    const data = await this.settingsService.updateSettings(dto, admin);
    return {
      success: true,
      message: 'Platform settings updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
