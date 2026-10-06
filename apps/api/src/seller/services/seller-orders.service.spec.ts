import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma, PrismaService } from '@tobetake/database';
import { SellerOrdersService } from './seller-orders.service';

describe('SellerOrdersService', () => {
  let service: SellerOrdersService;
  let prisma: {
    order: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    orderStatusHistory: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerOrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerOrdersService>(SellerOrdersService);
  });

  it('should isolate and return only orders containing items belonging to the seller', async () => {
    prisma.order.count.mockResolvedValue(1);
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: 'ORD-1001',
        customerId: 'cust-1',
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        currency: 'PKR',
        shippingTotal: new Prisma.Decimal(250),
        taxTotal: new Prisma.Decimal(0),
        discountTotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(3250),
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { firstName: 'Fatima', lastName: 'Khan', email: 'fatima.khan@example.pk' },
        items: [
          {
            id: 'item-1',
            sellerId: 'seller-A',
            productName: 'Peshawar Green Tea',
            sku: 'TEA-01',
            quantity: 2,
            unitPrice: new Prisma.Decimal(1500),
            totalPrice: new Prisma.Decimal(3000),
          },
        ],
      },
    ]);

    const result = await service.getOrders('seller-A', {});
    expect(result.total).toBe(1);
    expect(result.items[0].subtotal).toBe(3000);
    expect(result.items[0].customerName).toBe('Fatima Khan');
  });

  it('should throw NotFoundException when seller views an order that has no items from their store', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-2',
      items: [], // No items matching seller-A
    });

    await expect(
      service.getOrderById('seller-A', 'order-2'),
    ).rejects.toThrow(NotFoundException);
  });

  describe('Order State Machine Transitions', () => {
    it('should allow valid transition from PENDING to PROCESSING', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({
          id: 'ord-pending',
          status: OrderStatus.PENDING,
          items: [{ id: 'item-1', sellerId: 'seller-A' }],
        })
        .mockResolvedValueOnce({
          id: 'ord-pending',
          orderNumber: 'ORD-100',
          customerId: 'cust-1',
          customer: { firstName: 'Fatima', lastName: 'Khan', email: 'fatima@test.pk' },
          status: OrderStatus.PROCESSING,
          paymentStatus: PaymentStatus.PAID,
          currency: 'PKR',
          shippingTotal: new Prisma.Decimal(0),
          taxTotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          items: [
            {
              id: 'item-1',
              sellerId: 'seller-A',
              productName: 'Product A',
              sku: 'SKU-A',
              quantity: 1,
              unitPrice: new Prisma.Decimal(2500),
              totalPrice: new Prisma.Decimal(2500),
            },
          ],
          shipments: [],
          commissions: [],
          returns: [],
          statusHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      prisma.order.update.mockResolvedValue({ id: 'ord-pending', status: OrderStatus.PROCESSING });

      const updated = await service.updateOrderStatus('seller-A', 'ord-pending', {
        status: OrderStatus.PROCESSING,
      });

      expect(updated.status).toBe(OrderStatus.PROCESSING);
      expect(prisma.order.update).toHaveBeenCalled();
    });

    it('should reject invalid transition from DELIVERED to PROCESSING with BadRequestException', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-delivered',
        status: OrderStatus.DELIVERED,
        items: [{ id: 'item-1', sellerId: 'seller-A' }],
      });

      await expect(
        service.updateOrderStatus('seller-A', 'ord-delivered', {
          status: OrderStatus.PROCESSING,
        }),
      ).rejects.toThrow('Invalid order status transition');
    });

    it('should reject invalid transition from CANCELLED to SHIPPED with BadRequestException', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-cancelled',
        status: OrderStatus.CANCELLED,
        items: [{ id: 'item-1', sellerId: 'seller-A' }],
      });

      await expect(
        service.updateOrderStatus('seller-A', 'ord-cancelled', {
          status: OrderStatus.SHIPPED,
        }),
      ).rejects.toThrow('Invalid order status transition');
    });
  });
});
