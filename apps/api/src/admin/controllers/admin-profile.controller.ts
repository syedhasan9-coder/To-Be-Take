import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AdminUserResponse, ApiResponse } from '@tobetake/shared-types';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminProfileService } from '../services/admin-profile.service';

@Controller('admin/profile')
@UseGuards(AdminAuthGuard)
export class AdminProfileController {
  constructor(private readonly profileService: AdminProfileService) {}

  @Get()
  async getProfile(
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<AdminUserResponse>> {
    const data = await this.profileService.getProfile(admin.id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put()
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<AdminUserResponse>> {
    const data = await this.profileService.updateProfile(admin.id, dto, admin);
    return {
      success: true,
      message: 'Profile updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.profileService.changePassword(admin.id, dto, admin);
    return {
      success: true,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
