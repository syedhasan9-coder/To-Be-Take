import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SellerAuthGuard } from '../guards/seller-auth.guard';
import {
  AuthenticatedSellerUser,
  CurrentSeller,
} from '../decorators/current-seller.decorator';
import { SellerNotificationsService } from '../services/seller-notifications.service';
import {
  AdminNotificationItem,
  ApiResponse,
  NotificationCenterData,
} from '@tobetake/shared-types';

@Controller('seller/notifications')
@UseGuards(SellerAuthGuard)
export class SellerNotificationsController {
  constructor(
    private readonly notificationsService: SellerNotificationsService,
  ) {}

  @Get()
  async getNotifications(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<NotificationCenterData>> {
    const data = await this.notificationsService.getNotifications(seller.id, {
      unreadOnly: unreadOnly === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentSeller() seller: AuthenticatedSellerUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<AdminNotificationItem>> {
    const data = await this.notificationsService.markAsRead(seller.id, id);
    return {
      success: true,
      message: 'Notification marked as read.',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('read-all')
  async markAllAsRead(
    @CurrentSeller() seller: AuthenticatedSellerUser,
  ): Promise<ApiResponse<{ count: number }>> {
    const data = await this.notificationsService.markAllAsRead(seller.id);
    return {
      success: true,
      message: `${data.count} notifications marked as read.`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
