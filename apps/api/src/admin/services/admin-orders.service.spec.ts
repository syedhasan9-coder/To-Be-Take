import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;
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
    permissions: ['ORDERS_VIEW', 'ORDERS_MANAGE'],
  };

  beforeEach(async () => {
    mockPrisma = {
      order: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'order-1',
            orderNumber: 'ORD-1001',
            customerId: 'cust-1',
            customer: {
              id: 'cust-1',
              firstName: 'Fatima',
              lastName: 'Khan',
              email: 'fatima@tobetake.dev',
              username: 'cust_fatima',
            },
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PAID,
            currency: 'PKR',
            subtotal: 2500,
            shippingTotal: 250,
            taxTotal: 0,
            discountTotal: 0,
            total: 2750,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { items: 2 },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          orderNumber: 'ORD-1001',
          customerId: 'cust-1',
          customer: {
            id: 'cust-1',
            firstName: 'Fatima',
            lastName: 'Khan',
            email: 'fatima@tobetake.dev',
            username: 'cust_fatima',
          },
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PAID,
          currency: 'PKR',
          subtotal: 2500,
          shippingTotal: 250,
          taxTotal: 0,
          discountTotal: 0,
          total: 2750,
          shippingAddress: 'House 14-B, Street 3, Sector F-7/2, Islamabad, 44000, Pakistan',
          billingAddress: 'House 14-B, Street 3, Sector F-7/2, Islamabad, 44000, Pakistan',
          customerNotes: null,
          adminNotes: null,
          cancellationReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 'item-1',
              orderId: 'order-1',
              productId: 'prod-1',
              sellerId: 'seller-1',
              seller: {
                id: 'seller-1',
                firstName: 'Tariq',
                lastName: 'Mehmood',
                storeName: 'Al-Madina Store',
                email: 'tariq@tobetake.dev',
              },
              productName: 'Handcrafted Ceramic Tea Mug',
              sku: 'BOT-MUG-001',
              quantity: 2,
              unitPrice: 1250,
              totalPrice: 2500,
              createdAt: new Date(),
            },
          ],
          payments: [],
          shipments: [],
          returns: [],
          commissions: [],
          statusHistory: [],
        }),
        update: jest.fn().mockResolvedValue({ id: 'order-1' }),
      },
      orderStatusHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      inventoryItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'inv-1',
          productId: 'prod-1',
          stockQuantity: 10,
        }),
        update: jest.fn().mockResolvedValue({ id: 'inv-1' }),
      },
      inventoryLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminOrdersService>(AdminOrdersService);
  });

  it('should list paginated orders with customer info', async () => {
    const result = await service.listOrders({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.total).toBe(1);
    expect(result.items[0].orderNumber).toBe('ORD-1001');
    expect(result.items[0].customerName).toBe('Fatima Khan');
  });

  it('should get detailed order with items', async () => {
    const order = await service.getOrderDetails('order-1');
    expect(order.id).toBe('order-1');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productName).toBe('Handcrafted Ceramic Tea Mug');
  });

  it('should update order status and record audit log', async () => {
    await service.updateOrderStatus(
      'order-1',
      { status: OrderStatus.CONFIRMED, notes: 'Order confirmed by admin' },
      mockAdminUser,
    );

    expect(mockPrisma.order.update).toHaveBeenCalled();
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalled();
    expect(mockAudit.recordLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ORDER_STATUS_UPDATED',
        targetType: 'Order',
      }),
    );
  });
});
