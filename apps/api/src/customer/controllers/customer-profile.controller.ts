import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerProfileSummary, UpdateCustomerProfileInput } from '@tobetake/shared-types';
import { CustomerProfileService } from '../services/customer-profile.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/profile')
@UseGuards(CustomerAuthGuard)
export class CustomerProfileController {
  constructor(private readonly profileService: CustomerProfileService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerProfileSummary>> {
    const data = await this.profileService.getProfile(user.id);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch()
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: UpdateCustomerProfileInput,
  ): Promise<ApiResponse<CustomerProfileSummary>> {
    const data = await this.profileService.updateProfile(user.id, input);
    return {
      success: true,
      message: 'Profile updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: { currentPassword: string; newPassword: string },
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.profileService.changePassword(user.id, input);
    return {
      success: true,
      message: 'Password changed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
