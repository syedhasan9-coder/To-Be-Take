import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse } from '@tobetake/shared-types';
import { CustomerOrdersService } from '../services/customer-orders.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/orders')
@UseGuards(CustomerAuthGuard)
export class CustomerOrdersController {
  constructor(private readonly ordersService: CustomerOrdersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getOrders(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Query('status') status?: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.ordersService.getCustomerOrders(user.id, status);
    return {
      success: true,
      message: 'Orders retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':idOrNumber')
  @HttpCode(HttpStatus.OK)
  async getOrder(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('idOrNumber') idOrNumber: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.ordersService.getOrderDetail(user.id, idOrNumber);
    return {
      success: true,
      message: 'Order details retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') orderId: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.ordersService.cancelOrder(user.id, orderId, reason);
    return {
      success: true,
      message: 'Order cancelled successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.CREATED)
  async requestReturn(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') orderId: string,
    @Body('reason') reason: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.ordersService.requestReturn(user.id, orderId, reason);
    return {
      success: true,
      message: 'Return request submitted successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
