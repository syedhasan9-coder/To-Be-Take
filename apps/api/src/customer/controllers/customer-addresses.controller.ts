import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerAddressItem, CreateAddressInput, UpdateAddressInput } from '@tobetake/shared-types';
import { CustomerAddressesService } from '../services/customer-addresses.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/addresses')
@UseGuards(CustomerAuthGuard)
export class CustomerAddressesController {
  constructor(private readonly addressesService: CustomerAddressesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAddresses(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerAddressItem[]>> {
    const data = await this.addressesService.getAddresses(user.id);
    return {
      success: true,
      message: 'Addresses retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: CreateAddressInput,
  ): Promise<ApiResponse<CustomerAddressItem>> {
    const data = await this.addressesService.createAddress(user.id, input);
    return {
      success: true,
      message: 'Address created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateAddress(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') id: string,
    @Body() input: UpdateAddressInput,
  ): Promise<ApiResponse<CustomerAddressItem>> {
    const data = await this.addressesService.updateAddress(user.id, id, input);
    return {
      success: true,
      message: 'Address updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<CustomerAddressItem>> {
    const data = await this.addressesService.setDefaultAddress(user.id, id);
    return {
      success: true,
      message: 'Default address set successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteAddress(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.addressesService.deleteAddress(user.id, id);
    return {
      success: true,
      message: 'Address deleted successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
