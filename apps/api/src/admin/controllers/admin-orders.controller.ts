import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, OrderDetailItem, OrderListItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminMutationThrottle } from '../../common/throttler/throttler.decorators';
import { AuthenticatedAdminUser, CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { OrderQueryDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminOrdersService } from '../services/admin-orders.service';

@Controller('admin/orders')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  @RequirePermissions('ORDERS_VIEW')
  async listOrders(
    @Query() query: OrderQueryDto,
  ): Promise<ApiResponse<PaginatedResult<OrderListItem>>> {
    const data = await this.ordersService.listOrders(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('ORDERS_VIEW')
  async getOrderDetails(@Param('id') id: string): Promise<ApiResponse<OrderDetailItem>> {
    const data = await this.ordersService.getOrderDetails(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  @RequirePermissions('ORDERS_MANAGE')
  @AdminMutationThrottle()
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<OrderDetailItem>> {
    const data = await this.ordersService.updateOrderStatus(id, dto, admin);
    return {
      success: true,
      message: `Order status successfully updated to ${dto.status}`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/cancel')
  @RequirePermissions('ORDERS_MANAGE')
  @AdminMutationThrottle()
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AuthenticatedAdminUser,
  ): Promise<ApiResponse<OrderDetailItem>> {
    const data = await this.ordersService.updateOrderStatus(
      id,
      { status: 'CANCELLED', cancellationReason: reason || 'Cancelled by administrator' },
      admin,
    );
    return {
      success: true,
      message: 'Order successfully cancelled',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
