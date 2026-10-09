import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiResponse,
  CustomerStorefrontData,
  CategoryItem,
  CustomerSellerSpotlight,
  CustomerProductQueryParams,
} from '@tobetake/shared-types';
import { CustomerStorefrontService } from '../services/customer-storefront.service';
import { CustomerProductsService } from '../services/customer-products.service';

@Controller('customer/storefront')
export class CustomerStorefrontController {
  constructor(
    private readonly storefrontService: CustomerStorefrontService,
    private readonly productsService: CustomerProductsService,
  ) {}

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

  @Get('products')
  @HttpCode(HttpStatus.OK)
  async getProducts(@Query() query: CustomerProductQueryParams): Promise<ApiResponse<any>> {
    const result = await this.productsService.findProducts(query);
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: result,
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
