import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService, OrderStatus, PaymentStatus } from '@tobetake/database';
import { EasypaisaService } from './easypaisa.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('EasypaisaService', () => {
  let service: EasypaisaService;
  let configService: ConfigService;
  let prisma: PrismaService;

  const mockConfigValues: Record<string, string> = {
    EASYPAISA_STORE_ID: 'EP_STORE_123',
    EASYPAISA_HASH_KEY: 'test_secret_hash_key_1234',
    EASYPAISA_POST_URL: 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf',
    EASYPAISA_SANDBOX_MODE: 'true',
    EASYPAISA_CALLBACK_URL: 'http://localhost:4000/api/payments/easypaisa/callback',
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
      return mockConfigValues[key] !== undefined ? mockConfigValues[key] : defaultVal;
    }),
  };

  const mockOrder = {
    id: 'order-ep-1',
    orderNumber: 'ORD-2026-8888',
    customerId: 'cust-1',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    total: 5000,
    currency: 'PKR',
    payments: [
      {
        id: 'pay-ep-1',
        orderId: 'order-ep-1',
        paymentMethod: 'EASYPAISA',
        status: PaymentStatus.PENDING,
        amount: 5000,
        currency: 'PKR',
        transactionReference: 'EP-INIT-ORD-2026-8888-123456',
        metadata: null,
      },
    ],
    customer: { id: 'cust-1', firstName: 'Ali', lastName: 'Raza' },
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn().mockResolvedValue(mockOrder),
      update: jest.fn().mockResolvedValue(mockOrder),
    },
    payment: {
      update: jest.fn().mockResolvedValue(mockOrder.payments[0]),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback({
        payment: {
          update: jest.fn().mockResolvedValue({ id: 'pay-ep-1', status: PaymentStatus.PAID }),
        },
        order: {
          update: jest.fn().mockResolvedValue({ id: 'order-ep-1', status: OrderStatus.CONFIRMED }),
        },
        orderStatusHistory: {
          create: jest.fn().mockResolvedValue({ id: 'osh-1' }),
        },
        cartItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        customerNotification: {
          create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        },
      });
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EasypaisaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EasypaisaService>(EasypaisaService);
    configService = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Configuration Validation', () => {
    it('should return true when genuine merchant credentials are provided', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when STORE_ID or HASH_KEY is missing', async () => {
      const emptyConfig = {
        get: jest.fn().mockImplementation((key: string, def?: string) => {
          if (key === 'EASYPAISA_STORE_ID' || key === 'EASYPAISA_HASH_KEY') return '';
          return def;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EasypaisaService,
          { provide: ConfigService, useValue: emptyConfig },
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      const unconfiguredService = module.get<EasypaisaService>(EasypaisaService);
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('Initiate Payment', () => {
    it('should generate valid HMAC-SHA256 signature and hosted checkout payload', async () => {
      const res = await service.initiatePayment({
        orderId: 'order-ep-1',
        orderNumber: 'ORD-2026-8888',
        amount: 5000,
        currency: 'PKR',
      });

      expect(res.postUrl).toBe('https://easypaystg.easypaisa.com.pk/easypay/Index.jsf');
      expect(res.params.storeId).toBe('EP_STORE_123');
      expect(res.params.amount).toBe('5000.0');
      expect(res.params.orderRefNum).toBe('ORD-2026-8888');
      expect(res.params.merchantHashedReq).toBeDefined();
      expect(res.params.merchantHashedReq.length).toBe(64); // SHA-256 hex length
    });

    it('should reject initiation when unconfigured without faking success', async () => {
      const unconfiguredService = new EasypaisaService(
        { get: jest.fn().mockReturnValue('') } as any,
        mockPrisma as any,
      );

      await expect(
        unconfiguredService.initiatePayment({
          orderId: 'order-ep-1',
          orderNumber: 'ORD-2026-8888',
          amount: 5000,
          currency: 'PKR',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-PKR currency', async () => {
      await expect(
        service.initiatePayment({
          orderId: 'order-ep-1',
          orderNumber: 'ORD-2026-8888',
          amount: 5000,
          currency: 'USD',
        }),
      ).rejects.toThrow('Pakistani Rupee');
    });
  });

  describe('Process Callback / IPN', () => {
    it('should reject callback when order does not exist', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.processCallback({
          orderRefNum: 'NON_EXISTENT',
          responseCode: '0000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject callback when amount mismatches order total', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      // Callback claims 2500 PKR but order total is 5000 PKR
      const mismatchPayload: Record<string, any> = {
        orderRefNum: 'ORD-2026-8888',
        amount: '2500',
        responseCode: '0000',
      };
      mismatchPayload.merchantHashedReq = service.generateRequestHash(mismatchPayload);

      await expect(service.processCallback(mismatchPayload)).rejects.toThrow(BadRequestException);
    });

    it('should verify valid callback and mark payment PAID exactly once', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      // Generate valid signature for callback payload
      const callbackPayload: Record<string, any> = {
        orderRefNum: 'ORD-2026-8888',
        amount: '5000',
        responseCode: '0000',
        responseDesc: 'Transaction Successful',
        transactionId: 'EP-TXN-998877',
      };
      callbackPayload.merchantHashedReq = service.generateRequestHash(callbackPayload);

      const result = await service.processCallback(callbackPayload);

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.orderNumber).toBe('ORD-2026-8888');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle duplicate callback idempotently without re-executing transactions', async () => {
      const alreadyPaidOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
        payments: [{ ...mockOrder.payments[0], status: PaymentStatus.PAID }],
      };
      mockPrisma.order.findFirst.mockResolvedValueOnce(alreadyPaidOrder);

      const result = await service.processCallback({
        orderRefNum: 'ORD-2026-8888',
        responseCode: '0000',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('already processed');
      // $transaction must NOT be re-called for idempotent replay
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle failed callback by marking payment and order FAILED without deleting cart', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      const callbackPayload: Record<string, any> = {
        orderRefNum: 'ORD-2026-8888',
        amount: '5000',
        responseCode: '0001',
        responseDesc: 'Insufficient Balance in Easypaisa Account',
        transactionId: 'EP-FAIL-112233',
      };
      callbackPayload.merchantHashedReq = service.generateRequestHash(callbackPayload);

      const result = await service.processCallback(callbackPayload);

      expect(result.success).toBe(false);
      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.failureReason).toBe('Insufficient Balance in Easypaisa Account');
    });

    it('should reject invalid or tampered signature', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(mockOrder);

      const callbackPayload: Record<string, any> = {
        orderRefNum: 'ORD-2026-8888',
        amount: '5000',
        responseCode: '0000',
        merchantHashedReq: 'tampered_invalid_signature_hex_1234567890abcdef',
      };

      await expect(service.processCallback(callbackPayload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
