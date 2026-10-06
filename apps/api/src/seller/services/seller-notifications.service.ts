import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import {
  AdminNotificationItem,
  NotificationCenterData,
} from '@tobetake/shared-types';

@Injectable()
export class SellerNotificationsService {
  private readonly logger = new Logger(SellerNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(
    sellerId: string,
    query: { unreadOnly?: boolean; page?: number; limit?: number },
  ): Promise<NotificationCenterData> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AdminNotificationWhereInput = {};
    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [unreadCount, notifications] = await Promise.all([
      this.prisma.adminNotification.count({ where: { isRead: false } }),
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted: AdminNotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      targetUrl: n.targetUrl,
      isRead: n.isRead,
      readAt: n.readAt,
      metadata: n.metadata,
      createdAt: n.createdAt,
    }));

    return {
      unreadCount,
      notifications: formatted,
    };
  }

  async markAsRead(
    sellerId: string,
    notificationId: string,
  ): Promise<AdminNotificationItem> {
    const existing = await this.prisma.adminNotification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.adminNotification.update({
      where: { id: notificationId },
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

  async markAllAsRead(sellerId: string): Promise<{ count: number }> {
    const result = await this.prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }
}
