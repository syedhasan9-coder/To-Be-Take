import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, ShippingStatus } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminShippingService } from './admin-shipping.service';

describe('AdminShippingService', () => {
  let service: AdminShippingService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    username: 'admin_ops',
    email: 'admin@tobetake.dev',
    firstName: 'Admin',
    lastName: 'Ops',
    roleId: 2,
    role: 'Admin',
    roleCode: 'ADMIN',
    permissions: ['SHIPPING_VIEW', 'SHIPPING_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      shipment: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ship-1',
            orderId: 'order-1',
            carrier: 'TCS Express',
            trackingNumber: 'TCS-12345678',
            trackingUrl: 'https://tcsexpress.com/track/TCS-12345678',
            status: ShippingStatus.IN_TRANSIT,
            estimatedDelivery: new Date(),
            shippedDate: new Date(),
            deliveredDate: null,
            notes: 'Left at Lahore depot',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: { orderNumber: 'ORD-1001' },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'ship-1',
          orderId: 'order-1',
          carrier: 'TCS Express',
          trackingNumber: 'TCS-12345678',
          trackingUrl: 'https://tcsexpress.com/track/TCS-12345678',
          status: ShippingStatus.IN_TRANSIT,
          estimatedDelivery: new Date(),
          shippedDate: new Date(),
          deliveredDate: null,
          notes: 'Left at Lahore depot',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: { orderNumber: 'ORD-1001', status: 'SHIPPED' },
        }),
        create: jest.fn().mockResolvedValue({
          id: 'ship-2',
          orderId: 'order-1',
          carrier: 'Leopards Courier',
          trackingNumber: 'LEO-987654',
          status: ShippingStatus.IN_TRANSIT,
          order: { orderNumber: 'ORD-1001' },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'ship-1',
          orderId: 'order-1',
          carrier: 'TCS Express',
          trackingNumber: 'TCS-12345678',
          status: ShippingStatus.DELIVERED,
          deliveredDate: new Date(),
          order: { orderNumber: 'ORD-1001' },
        }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          orderNumber: 'ORD-1001',
          status: 'PROCESSING',
        }),
        update: jest.fn().mockResolvedValue({ id: 'order-1' }),
      },
      orderStatusHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminShippingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminShippingService>(AdminShippingService);
  });

  it('should list shipments with order number and carrier', async () => {
    const result = await service.listShipments({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items[0].carrier).toBe('TCS Express');
    expect(result.items[0].trackingNumber).toBe('TCS-12345678');
  });

  it('should create shipment, update order status and log audit event', async () => {
    await service.createShipment(
      {
        orderId: 'order-1',
        carrier: 'Leopards Courier',
        trackingNumber: 'LEO-987654',
      },
      mockAdminUser,
    );

    expect(mockPrisma.shipment.create).toHaveBeenCalled();
    expect(mockPrisma.order.update).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SHIPMENT_CREATED',
        targetType: 'Shipment',
      }),
    );
  });
});
