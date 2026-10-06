import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, CustomerProductQueryParams, CustomerProductDetail } from '@tobetake/shared-types';
import { CustomerProductsService } from '../services/customer-products.service';

@Controller('customer/products')
export class CustomerProductsController {
  constructor(private readonly productsService: CustomerProductsService) {}

  @Get()
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

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  async getProduct(@Param('idOrSlug') idOrSlug: string): Promise<ApiResponse<CustomerProductDetail>> {
    const product = await this.productsService.getProductByIdOrSlug(idOrSlug);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: product,
      timestamp: new Date().toISOString(),
    };
  }
}
