import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerProfileService } from '../services/seller-profile.service';
import { UpdateSellerProfileDto } from '../dto/update-seller-profile.dto';
import { ApiResponse, SellerUserResponse } from '@tobetake/shared-types';

@Controller('seller/profile')
@UseGuards(SellerAuthGuard)
export class SellerProfileController {
  constructor(private readonly profileService: SellerProfileService) {}

  @Get()
  async getProfile(
    @CurrentSeller() seller: AuthenticatedSellerUser,
  ): Promise<ApiResponse<SellerUserResponse & { approvalStatus?: string }>> {
    const data = await this.profileService.getProfile(seller.id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put()
  async updateProfilePut(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Body() dto: UpdateSellerProfileDto,
  ): Promise<ApiResponse<SellerUserResponse & { approvalStatus?: string }>> {
    const data = await this.profileService.updateProfile(seller.id, dto);
    return {
      success: true,
      message: 'Store profile updated successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch()
  async updateProfilePatch(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Body() dto: UpdateSellerProfileDto,
  ): Promise<ApiResponse<SellerUserResponse & { approvalStatus?: string }>> {
    const data = await this.profileService.updateProfile(seller.id, dto);
    return {
      success: true,
      message: 'Store profile updated successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
