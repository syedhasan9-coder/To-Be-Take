import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import {
  AdminNotificationItem,
  NotificationCenterData,
  PaginatedResult,
} from '@tobetake/shared-types';
import { NotificationQueryDto } from '../dto/notification.dto';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List notifications with pagination and filters.
   */
  async listNotifications(
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<AdminNotificationItem>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AdminNotificationWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [total, notifications] = await Promise.all([
      this.prisma.adminNotification.count({ where }),
      this.prisma.adminNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        targetUrl: n.targetUrl,
        isRead: n.isRead,
        readAt: n.readAt,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get notification center summary with unread badge counter.
   */
  async getNotificationSummary(): Promise<NotificationCenterData> {
    const [unreadCount, recent] = await Promise.all([
      this.prisma.adminNotification.count({ where: { isRead: false } }),
      this.prisma.adminNotification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      unreadCount,
      notifications: recent.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        targetUrl: n.targetUrl,
        isRead: n.isRead,
        readAt: n.readAt,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
    };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: string): Promise<AdminNotificationItem> {
    const notif = await this.prisma.adminNotification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundException(`Notification with ID '${id}' was not found`);
    }

    const updated = await this.prisma.adminNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      targetUrl: updated.targetUrl,
      isRead: updated.isRead,
      readAt: updated.readAt,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    await this.prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
