import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, CategoryItem } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminCategoriesService } from '../services/admin-categories.service';

@Controller('admin/categories')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: AdminCategoriesService) {}

  @Get()
  @RequirePermissions('CATEGORIES_VIEW')
  async listCategories(@Query() query: CategoryQueryDto): Promise<ApiResponse<CategoryItem[]>> {
    const data = await this.categoriesService.listCategories(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('CATEGORIES_VIEW')
  async getCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<CategoryItem>> {
    const data = await this.categoriesService.getCategory(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @RequirePermissions('CATEGORIES_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<CategoryItem>> {
    const data = await this.categoriesService.createCategory(dto, admin);
    return {
      success: true,
      message: 'Category created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @RequirePermissions('CATEGORIES_MANAGE')
  @AdminMutationThrottle()
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<CategoryItem>> {
    const data = await this.categoriesService.updateCategory(id, dto, admin);
    return {
      success: true,
      message: 'Category updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/toggle')
  @RequirePermissions('CATEGORIES_MANAGE')
  @AdminMutationThrottle()
  async toggleCategoryStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<CategoryItem>> {
    const data = await this.categoriesService.toggleCategoryStatus(id, admin);
    return {
      success: true,
      message: `Category is now ${data.isActive ? 'active' : 'inactive'}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
