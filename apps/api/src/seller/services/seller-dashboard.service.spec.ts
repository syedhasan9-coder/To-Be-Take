import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaService, ProductStatus } from '@tobetake/database';
import { SellerDashboardService } from './seller-dashboard.service';

describe('SellerDashboardService', () => {
  let service: SellerDashboardService;
  let prisma: {
    product: {
      findMany: jest.Mock;
    };
    orderItem: {
      findMany: jest.Mock;
    };
    commissionRecord: {
      findMany: jest.Mock;
    };
    sellerPayout: {
      findMany: jest.Mock;
    };
    orderReturn: {
      findMany: jest.Mock;
    };
    productReview: {
      findMany: jest.Mock;
    };
    adminNotification: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn(),
      },
      commissionRecord: {
        findMany: jest.fn(),
      },
      sellerPayout: {
        findMany: jest.fn(),
      },
      orderReturn: {
        findMany: jest.fn(),
      },
      productReview: {
        findMany: jest.fn(),
      },
      adminNotification: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerDashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerDashboardService>(SellerDashboardService);
  });

  it('should calculate accurate KPIs and load recent data for seller', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        sellerId: 'seller-1',
        name: 'Serum',
        sku: 'SRM-1',
        price: new Prisma.Decimal(45.0),
        status: ProductStatus.ACTIVE,
        inventory: {
          id: 'inv-1',
          stockQuantity: 4,
          lowStockThreshold: 5,
          reservedQuantity: 1,
        },
      },
    ]);

    prisma.orderItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        orderId: 'ord-1',
        sellerId: 'seller-1',
        productId: 'prod-1',
        quantity: 2,
        totalPrice: new Prisma.Decimal(90.0),
        order: {
          id: 'ord-1',
          orderNumber: 'ORD-100',
          customerId: 'c-1',
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          currency: 'PKR',
          shippingTotal: new Prisma.Decimal(250),
          taxTotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          customer: { firstName: 'Zainab', lastName: 'Raza', email: 'zainab@test.pk' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ]);

    prisma.commissionRecord.findMany.mockResolvedValue([
      {
        id: 'comm-1',
        sellerId: 'seller-1',
        orderAmount: new Prisma.Decimal(90.0),
        platformFee: new Prisma.Decimal(9.0),
        sellerEarnings: new Prisma.Decimal(81.0),
      },
    ]);

    prisma.sellerPayout.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        sellerId: 'seller-1',
        amount: new Prisma.Decimal(50.0),
        status: 'PAID',
      },
    ]);

    prisma.orderReturn.findMany.mockResolvedValue([]);
    prisma.productReview.findMany.mockResolvedValue([]);
    prisma.adminNotification.findMany.mockResolvedValue([]);

    const result = await service.getDashboardData('seller-1');

    expect(result.kpis.totalSales).toBe(90.0);
    expect(result.kpis.netSales).toBe(81.0);
    expect(result.kpis.totalOrders).toBe(1);
    expect(result.kpis.deliveredOrders).toBe(1);
    expect(result.kpis.activeProducts).toBe(1);
    expect(result.kpis.lowStockProducts).toBe(1);
    expect(result.kpis.totalPaidPayouts).toBe(50.0);
  });
});
