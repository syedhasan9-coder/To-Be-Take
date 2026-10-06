import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerCartSummary, AddToCartInput, UpdateCartItemInput } from '@tobetake/shared-types';
import { CustomerCartService } from '../services/customer-cart.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/cart')
@UseGuards(CustomerAuthGuard)
export class CustomerCartController {
  constructor(private readonly cartService: CustomerCartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.getCart(user.id);
    return {
      success: true,
      message: 'Cart retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async addToCart(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: AddToCartInput,
  ): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.addToCart(user.id, input);
    return {
      success: true,
      message: 'Item added to cart',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateQuantity(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') itemId: string,
    @Body() input: UpdateCartItemInput,
  ): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.updateQuantity(user.id, itemId, input);
    return {
      success: true,
      message: 'Cart updated',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateQuantityPut(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') itemId: string,
    @Body() input: UpdateCartItemInput,
  ): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.updateQuantity(user.id, itemId, input);
    return {
      success: true,
      message: 'Cart updated',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') itemId: string,
  ): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.removeItem(user.id, itemId);
    return {
      success: true,
      message: 'Item removed from cart',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(@CurrentCustomer() user: AuthenticatedCustomerUser): Promise<ApiResponse<CustomerCartSummary>> {
    const data = await this.cartService.clearCart(user.id);
    return {
      success: true,
      message: 'Cart cleared',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
