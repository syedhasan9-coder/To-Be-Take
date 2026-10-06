import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ManagedUserItem, PaginatedResult } from '@tobetake/shared-types';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SuperAdminOnlyGuard } from '../guards/super-admin-only.guard';
import { AdminUsersService } from '../services/admin-users.service';

@Controller('admin/users')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  // List all users
  @Get()
  @RequirePermissions('USERS_VIEW')
  async listAllUsers(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ManagedUserItem>>> {
    const data = await this.usersService.listUsers([], query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // List Customers / Buyers
  @Get('customers')
  @RequirePermissions('USERS_VIEW')
  async listCustomers(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ManagedUserItem>>> {
    const data = await this.usersService.listUsers(['CUST'], query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // List Customers with Commerce Metrics
  @Get('customers/commerce')
  @RequirePermissions('USERS_VIEW')
  async listCustomersCommerce(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<import('@tobetake/shared-types').CustomerCommerceItem>>> {
    const data = await this.usersService.listCustomersCommerce(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Get Customer Commerce Detail
  @Get('customers/:id/commerce')
  @RequirePermissions('USERS_VIEW')
  async getCustomerCommerceDetail(
    @Param('id') id: string,
  ): Promise<ApiResponse<import('@tobetake/shared-types').CustomerCommerceDetail>> {
    const data = await this.usersService.getCustomerCommerceDetail(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // List Sellers / Vendors
  @Get('sellers')
  @RequirePermissions('SELLERS_VIEW')
  async listSellers(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ManagedUserItem>>> {
    const data = await this.usersService.listUsers(['VENDOR'], query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // List Sellers with Commerce Metrics
  @Get('sellers/commerce')
  @RequirePermissions('SELLERS_VIEW')
  async listSellersCommerce(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<import('@tobetake/shared-types').SellerCommerceItem>>> {
    const data = await this.usersService.listSellersCommerce(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Get Seller Commerce Detail
  @Get('sellers/:id/commerce')
  @RequirePermissions('SELLERS_VIEW')
  async getSellerCommerceDetail(
    @Param('id') id: string,
  ): Promise<ApiResponse<import('@tobetake/shared-types').SellerCommerceDetail>> {
    const data = await this.usersService.getSellerCommerceDetail(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // List Admins & Super Admins (Super Admin only)
  @Get('admins')
  @UseGuards(SuperAdminOnlyGuard)
  @RequirePermissions('ADMINS_VIEW')
  async listAdmins(
    @Query() query: AdminUserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ManagedUserItem>>> {
    const data = await this.usersService.listUsers(['ADMIN', 'SPADMIN'], query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Get user details
  @Get(':id')
  @RequirePermissions('USERS_VIEW')
  async getUserDetails(@Param('id') id: string): Promise<ApiResponse<ManagedUserItem>> {
    const data = await this.usersService.getUserDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Update user status
  @Patch(':id/status')
  @RequirePermissions('USERS_SUSPEND')
  @AdminMutationThrottle()
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ManagedUserItem>> {
    const data = await this.usersService.updateUserStatus(id, dto, admin);
    return {
      success: true,
      message: `User status successfully updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Create an Admin user (Super Admin only)
  @Post('admins')
  @UseGuards(SuperAdminOnlyGuard)
  @RequirePermissions('ADMINS_MANAGE')
  @AdminMutationThrottle()
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ManagedUserItem>> {
    const data = await this.usersService.createAdmin(dto, admin);
    return {
      success: true,
      message: 'Admin account created successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Update an Admin user (Super Admin only)
  @Patch('admins/:id')
  @UseGuards(SuperAdminOnlyGuard)
  @RequirePermissions('ADMINS_MANAGE')
  @AdminMutationThrottle()
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<ManagedUserItem>> {
    const data = await this.usersService.updateAdmin(id, dto, admin);
    return {
      success: true,
      message: 'Admin account updated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
