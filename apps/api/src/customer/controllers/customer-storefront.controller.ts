import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, CustomerStorefrontData, CategoryItem, CustomerSellerSpotlight } from '@tobetake/shared-types';
import { CustomerStorefrontService } from '../services/customer-storefront.service';

@Controller('customer/storefront')
export class CustomerStorefrontController {
  constructor(private readonly storefrontService: CustomerStorefrontService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getStorefront(): Promise<ApiResponse<CustomerStorefrontData>> {
    const data = await this.storefrontService.getStorefrontData();
    return {
      success: true,
      message: 'Storefront data retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories(): Promise<ApiResponse<CategoryItem[]>> {
    const data = await this.storefrontService.getCategories();
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sellers')
  @HttpCode(HttpStatus.OK)
  async getSellers(): Promise<ApiResponse<CustomerSellerSpotlight[]>> {
    const data = await this.storefrontService.getSellerSpotlights();
    return {
      success: true,
      message: 'Sellers retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
