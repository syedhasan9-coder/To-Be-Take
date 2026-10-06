import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CheckoutPreviewData, PlaceOrderInput, OrderPlacementResponse, CheckoutPreviewInput } from '@tobetake/shared-types';
import { CustomerCheckoutService } from '../services/customer-checkout.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/checkout')
@UseGuards(CustomerAuthGuard)
export class CustomerCheckoutController {
  constructor(private readonly checkoutService: CustomerCheckoutService) {}

  @Get('preview')
  @HttpCode(HttpStatus.OK)
  async getPreviewQuery(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Query() query?: CheckoutPreviewInput,
  ): Promise<ApiResponse<CheckoutPreviewData>> {
    const data = await this.checkoutService.getCheckoutPreview(user.id, query);
    return {
      success: true,
      message: 'Checkout preview calculated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async getPreview(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input?: CheckoutPreviewInput,
  ): Promise<ApiResponse<CheckoutPreviewData>> {
    const data = await this.checkoutService.getCheckoutPreview(user.id, input);
    return {
      success: true,
      message: 'Checkout preview calculated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('place-order')
  @HttpCode(HttpStatus.CREATED)
  async placeOrder(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Body() input: PlaceOrderInput,
  ): Promise<ApiResponse<OrderPlacementResponse>> {
    const data = await this.checkoutService.placeOrder(user.id, input);
    return {
      success: true,
      message: 'Order placed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
