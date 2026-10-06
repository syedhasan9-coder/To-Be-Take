import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { CustomerNotificationItem } from '@tobetake/shared-types';

@Injectable()
export class CustomerNotificationsService {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string): Promise<{ notifications: CustomerNotificationItem[]; unreadCount: number }> {
    const notifications = await this.prisma.customerNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const mapped: CustomerNotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type as any,
      title: n.title,
      message: n.message,
      targetUrl: n.targetUrl || undefined,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    return {
      notifications: mapped,
      unreadCount,
    };
  }

  async markAsRead(userId: string, id: string): Promise<{ success: boolean }> {
    await this.prisma.customerNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.prisma.customerNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
