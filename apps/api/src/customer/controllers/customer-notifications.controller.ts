import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, CustomerNotificationItem } from '@tobetake/shared-types';
import { CustomerNotificationsService } from '../services/customer-notifications.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import { CurrentCustomer, AuthenticatedCustomerUser } from '../decorators/current-customer.decorator';

@Controller('customer/notifications')
@UseGuards(CustomerAuthGuard)
export class CustomerNotificationsController {
  constructor(private readonly notificationsService: CustomerNotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
  ): Promise<ApiResponse<{ notifications: CustomerNotificationItem[]; unreadCount: number }>> {
    const data = await this.notificationsService.getNotifications(user.id);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.notificationsService.markAsRead(user.id, id);
    return {
      success: true,
      message: 'Notification marked as read',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsReadPut(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.notificationsService.markAsRead(user.id, id);
    return {
      success: true,
      message: 'Notification marked as read',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsReadPut(
    @CurrentCustomer() user: AuthenticatedCustomerUser,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
