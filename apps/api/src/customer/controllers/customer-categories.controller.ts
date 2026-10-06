import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, CategoryItem } from '@tobetake/shared-types';
import { CustomerStorefrontService } from '../services/customer-storefront.service';

@Controller('customer/categories')
export class CustomerCategoriesController {
  constructor(private readonly storefrontService: CustomerStorefrontService) {}

  @Get()
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
}
