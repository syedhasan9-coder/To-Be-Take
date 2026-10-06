import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType, PrismaService } from '@tobetake/database';
import { AdminNotificationsService } from './admin-notifications.service';

describe('AdminNotificationsService', () => {
  let service: AdminNotificationsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      adminNotification: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'notif-1',
            type: NotificationType.ORDER_CREATED,
            title: 'New Order Received',
            message: 'Order #ORD-1001 was created by customer.',
            targetUrl: '/admin/orders/order-1',
            isRead: false,
            readAt: null,
            metadata: null,
            createdAt: new Date(),
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'notif-1',
          type: NotificationType.ORDER_CREATED,
          title: 'New Order Received',
          message: 'Order #ORD-1001 was created by customer.',
          targetUrl: '/admin/orders/order-1',
          isRead: false,
          readAt: null,
          metadata: null,
          createdAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'notif-1',
          type: NotificationType.ORDER_CREATED,
          title: 'New Order Received',
          message: 'Order #ORD-1001 was created by customer.',
          targetUrl: '/admin/orders/order-1',
          isRead: true,
          readAt: new Date(),
          metadata: null,
          createdAt: new Date(),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminNotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminNotificationsService>(AdminNotificationsService);
  });

  it('should list notifications and get unread summary counter', async () => {
    const summary = await service.getNotificationSummary();
    expect(summary.unreadCount).toBe(2);
    expect(summary.notifications).toHaveLength(1);
  });

  it('should mark single notification as read', async () => {
    const updated = await service.markAsRead('notif-1');
    expect(mockPrisma.adminNotification.update).toHaveBeenCalled();
    expect(updated.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    await service.markAllAsRead();
    expect(mockPrisma.adminNotification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isRead: false },
      }),
    );
  });
});
