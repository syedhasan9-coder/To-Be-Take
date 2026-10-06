import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatus, PrismaService } from '@tobetake/database';
import { AdminAuditService } from './admin-audit.service';
import { AdminPaymentsService } from './admin-payments.service';

describe('AdminPaymentsService', () => {
  let service: AdminPaymentsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      payment: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pay-1',
            orderId: 'order-1',
            transactionReference: 'TXN-987654321',
            paymentMethod: 'JAZZCASH',
            amount: 2750.0,
            currency: 'PKR',
            status: PaymentStatus.PAID,
            failureReason: null,
            metadata: null,
            paidAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            order: {
              orderNumber: 'ORD-1001',
              customer: {
                id: 'cust-1',
                firstName: 'Fatima',
                lastName: 'Khan',
                email: 'fatima@tobetake.dev',
              },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'pay-1',
          orderId: 'order-1',
          transactionReference: 'TXN-987654321',
          paymentMethod: 'JAZZCASH',
          amount: 2750.0,
          currency: 'PKR',
          status: PaymentStatus.PAID,
          failureReason: null,
          metadata: null,
          paidAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          order: {
            orderNumber: 'ORD-1001',
            customer: {
              id: 'cust-1',
              firstName: 'Fatima',
              lastName: 'Khan',
              email: 'fatima@tobetake.dev',
            },
          },
        }),
      },
    };

    const mockAuditService = {
      recordLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminPaymentsService>(AdminPaymentsService);
  });

  it('should list payments with order reference and customer', async () => {
    const result = await service.listPayments({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.total).toBe(1);
    expect(result.items[0].transactionReference).toBe('TXN-987654321');
    expect(result.items[0].amount).toBe(2750.0);
  });
});
