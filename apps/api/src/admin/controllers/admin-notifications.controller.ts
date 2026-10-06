import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  AdminNotificationItem,
  ApiResponse,
  NotificationCenterData,
  PaginatedResult,
} from '@tobetake/shared-types';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { NotificationQueryDto } from '../dto/notification.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AdminNotificationsService } from '../services/admin-notifications.service';

@Controller('admin/notifications')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: AdminNotificationsService) {}

  @Get()
  @RequirePermissions('NOTIFICATIONS_VIEW')
  async listNotifications(
    @Query() query: NotificationQueryDto,
  ): Promise<ApiResponse<PaginatedResult<AdminNotificationItem>>> {
    const data = await this.notificationsService.listNotifications(query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('summary')
  @RequirePermissions('NOTIFICATIONS_VIEW')
  async getNotificationSummary(): Promise<ApiResponse<NotificationCenterData>> {
    const data = await this.notificationsService.getNotificationSummary();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/read')
  @RequirePermissions('NOTIFICATIONS_MANAGE')
  async markAsRead(@Param('id') id: string): Promise<ApiResponse<AdminNotificationItem>> {
    const data = await this.notificationsService.markAsRead(id);
    return {
      success: true,
      message: 'Notification marked as read',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('read-all')
  @RequirePermissions('NOTIFICATIONS_MANAGE')
  async markAllAsRead(): Promise<ApiResponse<null>> {
    await this.notificationsService.markAllAsRead();
    return {
      success: true,
      message: 'All notifications marked as read',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('mark-all-read')
  @RequirePermissions('NOTIFICATIONS_MANAGE')
  async markAllAsReadAlias(): Promise<ApiResponse<null>> {
    return this.markAllAsRead();
  }
}
