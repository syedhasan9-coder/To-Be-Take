import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerWishlistItem } from '@tobetake/shared-types';
import { CustomerWishlistService } from '../services/customer-wishlist.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/wishlist')
@UseGuards(CustomerAuthGuard)
export class CustomerWishlistController {
  constructor(private readonly wishlistService: CustomerWishlistService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getWishlist(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerWishlistItem[]>> {
    const data = await this.wishlistService.getWishlist(user.id);
    return {
      success: true,
      message: 'Wishlist retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleWishlist(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body('productId') productId: string,
  ): Promise<ApiResponse<{ wishlisted: boolean; items: CustomerWishlistItem[] }>> {
    const data = await this.wishlistService.toggleWishlist(user.id, productId);
    return {
      success: true,
      message: data.wishlisted ? 'Item added to wishlist' : 'Item removed from wishlist',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':productId/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleWishlistByParam(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('productId') productId: string,
  ): Promise<ApiResponse<{ wishlisted: boolean; items: CustomerWishlistItem[] }>> {
    const data = await this.wishlistService.toggleWishlist(user.id, productId);
    return {
      success: true,
      message: data.wishlisted ? 'Item added to wishlist' : 'Item removed from wishlist',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':productId')
  @HttpCode(HttpStatus.OK)
  async toggleWishlistDirect(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('productId') productId: string,
  ): Promise<ApiResponse<{ wishlisted: boolean; items: CustomerWishlistItem[] }>> {
    const data = await this.wishlistService.toggleWishlist(user.id, productId);
    return {
      success: true,
      message: data.wishlisted ? 'Item added to wishlist' : 'Item removed from wishlist',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('productId') productId: string,
  ): Promise<ApiResponse<CustomerWishlistItem[]>> {
    const data = await this.wishlistService.removeItem(user.id, productId);
    return {
      success: true,
      message: 'Item removed from wishlist',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
