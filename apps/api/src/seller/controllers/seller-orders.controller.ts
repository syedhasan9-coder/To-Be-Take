import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerOrdersService } from '../services/seller-orders.service';
import { UpdateSellerOrderStatusDto } from '../dto/update-seller-order-status.dto';
import {
  ApiResponse,
  OrderDetailItem,
  OrderListItem,
  PaginatedResult,
} from '@tobetake/shared-types';

@Controller('seller/orders')
@UseGuards(SellerAuthGuard)
export class SellerOrdersController {
  constructor(private readonly ordersService: SellerOrdersService) {}

  @Get()
  async getOrders(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PaginatedResult<OrderListItem>>> {
    const data = await this.ordersService.getOrders(seller.id, {
      search,
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

  @Get(':id')
  async getOrderById(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<OrderDetailItem>> {
    const data = await this.ordersService.getOrderById(seller.id, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
    @Body() dto: UpdateSellerOrderStatusDto,
  ): Promise<ApiResponse<OrderDetailItem>> {
    const data = await this.ordersService.updateOrderStatus(seller.id, id, dto);
    return {
      success: true,
      message: `Order status updated to ${dto.status}.`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
