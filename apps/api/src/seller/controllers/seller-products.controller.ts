import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerProductsService } from '../services/seller-products.service';
import { CreateSellerProductDto } from '../dto/create-seller-product.dto';
import { UpdateSellerProductDto } from '../dto/update-seller-product.dto';
import { ApiResponse, PaginatedResult, ProductListItem } from '@tobetake/shared-types';
import { ProductStatus } from '@tobetake/database';

@Controller('seller/products')
@UseGuards(SellerAuthGuard)
export class SellerProductsController {
  constructor(private readonly productsService: SellerProductsService) {}

  @Get()
  async getProducts(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
    const data = await this.productsService.getProducts(seller.id, {
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('categories')
  async getCategories(
    @CurrentSeller() _seller: AuthenticatedSellerUser,
  ): Promise<
    ApiResponse<
      Array<{ id: number; name: string; slug: string; description: string | null }>
    >
  > {
    const data = await this.productsService.getCategories();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async getProductById(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<ProductListItem>> {
    const data = await this.productsService.getProductById(seller.id, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async createProduct(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Body() dto: CreateSellerProductDto,
  ): Promise<ApiResponse<ProductListItem>> {
    const data = await this.productsService.createProduct(seller.id, dto);
    return {
      success: true,
      message: 'Product created successfully in your catalog.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @Patch(':id')
  async updateProduct(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
    @Body() dto: UpdateSellerProductDto,
  ): Promise<ApiResponse<ProductListItem>> {
    const data = await this.productsService.updateProduct(seller.id, id, dto);
    return {
      success: true,
      message: 'Product updated successfully.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
  ): Promise<ApiResponse<ProductListItem>> {
    const data = await this.productsService.updateProductStatus(seller.id, id, status);
    return {
      success: true,
      message: `Product status updated to ${status}.`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  async deleteProduct(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const data = await this.productsService.deleteProduct(seller.id, id);
    return {
      success: true,
      message: data.message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
