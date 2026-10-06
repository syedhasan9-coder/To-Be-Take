import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiResponse,
  PaginatedResult,
  ProductDetailItem,
  ProductListItem,
} from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import {
  CreateProductDto,
  ModerateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '../dto/product.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminProductsService } from '../services/admin-products.service';

@Controller('admin/products')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @RequirePermissions('PRODUCTS_VIEW')
  async listProducts(
    @Query() query: ProductQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
    const data = await this.productsService.listProducts(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('PRODUCTS_VIEW')
  async getProductDetails(@Param('id') id: string): Promise<ApiResponse<ProductDetailItem>> {
    const data = await this.productsService.getProductDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @RequirePermissions('PRODUCTS_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ProductDetailItem>> {
    const data = await this.productsService.createProduct(dto, admin);
    return {
      success: true,
      message: 'Product created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @RequirePermissions('PRODUCTS_MANAGE')
  @AdminMutationThrottle()
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ProductDetailItem>> {
    const data = await this.productsService.updateProduct(id, dto, admin);
    return {
      success: true,
      message: 'Product updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/moderate')
  @RequirePermissions('PRODUCTS_MANAGE')
  @AdminMutationThrottle()
  async moderateProduct(
    @Param('id') id: string,
    @Body() dto: ModerateProductDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ProductDetailItem>> {
    const data = await this.productsService.moderateProduct(id, dto, admin);
    return {
      success: true,
      message: `Product status successfully updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @RequirePermissions('PRODUCTS_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.OK)
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<null>> {
    await this.productsService.deleteProduct(id, admin);
    return {
      success: true,
      message: 'Product removed from active catalog',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
