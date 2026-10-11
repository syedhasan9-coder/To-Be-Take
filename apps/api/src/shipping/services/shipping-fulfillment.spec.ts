import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, ShippingStatus } from '@tobetake/database';
import { ManualCourierProvider } from '../providers/manual-courier.provider';
import { TcsCourierProvider } from '../providers/tcs-courier.provider';
import { LeopardsCourierProvider } from '../providers/leopards-courier.provider';
import { CourierRegistryService } from './courier-registry.service';
import { CodSettlementService } from './cod-settlement.service';
import { AdminShippingService } from '../../admin/services/admin-shipping.service';
import { AdminOrdersService } from '../../admin/services/admin-orders.service';
import { SellerShippingService } from '../../seller/services/seller-shipping.service';

describe('Phase 3: Courier Fulfillment, Order Management, and COD Settlement', () => {
  let manualProvider: ManualCourierProvider;
  let tcsProvider: TcsCourierProvider;
  let leopardsProvider: LeopardsCourierProvider;
  let courierRegistry: CourierRegistryService;
  let codSettlementService: CodSettlementService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockConfigService: any;

  beforeEach(() => {
    manualProvider = new ManualCourierProvider();

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => defaultValue || null),
    };

    tcsProvider = new TcsCourierProvider(mockConfigService as unknown as ConfigService);
    leopardsProvider = new LeopardsCourierProvider(mockConfigService as unknown as ConfigService);
    courierRegistry = new CourierRegistryService(manualProvider, tcsProvider, leopardsProvider);

    mockPrisma = {
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      shipment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    mockAudit = {
      recordLog: jest.fn().mockResolvedValue({}),
    };

    codSettlementService = new CodSettlementService(mockPrisma, mockAudit);
  });

  describe('1. Manual Courier Providers & AWB Validation', () => {
    it('should successfully book with a valid manual tracking/AWB number', async () => {
      const result = await manualProvider.bookShipment({
        orderId: 'order-1',
        orderNumber: 'ORD-2026-0001',
        recipientName: 'Ali Khan',
        recipientPhone: '03001234567',
        destinationAddress: 'Gulberg III, Lahore',
        destinationCity: 'Lahore',
        weightKg: 1.2,
        pieces: 2,
        codAmount: 3500,
        trackingNumber: '7728192831',
      });

      expect(result.trackingNumber).toBe('7728192831');
      expect(result.bookingMode).toBe('MANUAL');
      expect(result.metadata?.codAmount).toBe(3500);
      expect(result.metadata?.weightKg).toBe(1.2);
    });

    it('should reject empty or missing tracking numbers in manual mode', async () => {
      await expect(
        manualProvider.bookShipment({
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          recipientName: 'Ali Khan',
          recipientPhone: '03001234567',
          destinationAddress: 'Gulberg III, Lahore',
          destinationCity: 'Lahore',
          weightKg: 1.0,
          pieces: 1,
          codAmount: 2000,
          trackingNumber: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject synthetic placeholder tracking numbers', async () => {
      await expect(
        manualProvider.bookShipment({
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          recipientName: 'Ali Khan',
          recipientPhone: '03001234567',
          destinationAddress: 'Gulberg III, Lahore',
          destinationCity: 'Lahore',
          weightKg: 1.0,
          pieces: 1,
          codAmount: 2000,
          trackingNumber: 'TCS-mock-12345',
        }),
      ).rejects.toThrow('Cannot use a mock or placeholder tracking number');
    });

    it('should detect unconfigured TCS and require a manual AWB number', async () => {
      expect(tcsProvider.isConfigured()).toBe(false);

      await expect(
        tcsProvider.bookShipment({
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          recipientName: 'Ahmed Raza',
          recipientPhone: '03211234567',
          destinationAddress: 'F-7, Islamabad',
          destinationCity: 'Islamabad',
          weightKg: 0.5,
          pieces: 1,
          codAmount: 1500,
        }),
      ).rejects.toThrow('TCS Courier API credentials are not configured');
    });

    it('should accept real manual AWB when booking via TCS without API credentials', async () => {
      const result = await tcsProvider.bookShipment({
        orderId: 'order-1',
        orderNumber: 'ORD-2026-0001',
        recipientName: 'Ahmed Raza',
        recipientPhone: '03211234567',
        destinationAddress: 'F-7, Islamabad',
        destinationCity: 'Islamabad',
        weightKg: 0.5,
        pieces: 1,
        codAmount: 1500,
        trackingNumber: 'TCS9988112233',
      });

      expect(result.trackingNumber).toBe('TCS9988112233');
      expect(result.carrier).toBe('TCS Express Pakistan');
      expect(result.bookingMode).toBe('MANUAL');
      expect(result.trackingUrl).toContain('TCS9988112233');
    });
  });

  describe('2. COD Collection Calculation & Remittance Settlement', () => {
    it('should accurately calculate COD required deducting any prepayments', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '5000',
        paymentStatus: PaymentStatus.PENDING,
        payments: [
          { paymentMethod: 'EASYPAISA', amount: '2000', status: PaymentStatus.PAID },
          { paymentMethod: 'COD', amount: '3000', status: PaymentStatus.PENDING },
        ],
      });

      const codSummary = await codSettlementService.calculateCodDetails('order-1');
      expect(codSummary.isCodOrder).toBe(true);
      expect(codSummary.orderTotal).toBe(5000);
      expect(codSummary.alreadyPaidAmount).toBe(2000);
      expect(codSummary.expectedCodAmount).toBe(3000);
      expect(codSummary.reconciliationStatus).toBe('PENDING');
    });

    it('should return 0 expected COD amount if order was fully paid online', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-2',
        orderNumber: 'ORD-2026-0002',
        total: '4500',
        paymentStatus: PaymentStatus.PAID,
        payments: [
          { paymentMethod: 'EASYPAISA', amount: '4500', status: PaymentStatus.PAID },
        ],
      });

      const codSummary = await codSettlementService.calculateCodDetails('order-2');
      expect(codSummary.expectedCodAmount).toBe(0);
      expect(codSummary.reconciliationStatus).toBe('NOT_APPLICABLE');
    });

    it('should successfully settle COD when exact remittance amount is received', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '3500',
        currency: 'PKR',
        paymentStatus: PaymentStatus.PENDING,
        payments: [
          { id: 'pay-cod-1', paymentMethod: 'COD', amount: '3500', status: PaymentStatus.PENDING },
        ],
      });

      mockPrisma.payment.update.mockResolvedValue({ id: 'pay-cod-1' });

      const admin = { id: 'admin-1', username: 'superadmin' } as any;

      const result = await codSettlementService.recordRemittance(
        'order-1',
        {
          remittanceReference: 'TCS-REMIT-77112',
          amountReceived: 3500,
          settlementDate: '2026-10-10',
          notes: 'Remittance confirmed via HBL settlement account',
        },
        admin,
      );

      expect(result.reconciliationStatus).toBe('SETTLED');
      expect(result.difference).toBe(0);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paymentStatus: PaymentStatus.PAID },
        }),
      );
      expect(mockAudit.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COD_REMITTANCE_RECORDED',
        }),
      );
    });

    it('should flag discrepancy and NOT mark order paid if remittance amount differs', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '4000',
        currency: 'PKR',
        paymentStatus: PaymentStatus.PENDING,
        payments: [
          { id: 'pay-cod-1', paymentMethod: 'COD', amount: '4000', status: PaymentStatus.PENDING },
        ],
      });

      mockPrisma.payment.update.mockResolvedValue({ id: 'pay-cod-1' });

      const admin = { id: 'admin-1', username: 'superadmin' } as any;

      // Remittance received is only 3500 instead of 4000
      const result = await codSettlementService.recordRemittance(
        'order-1',
        {
          remittanceReference: 'TCS-SHORT-REMIT-991',
          amountReceived: 3500,
          notes: 'Short payment received',
        },
        admin,
      );

      expect(result.reconciliationStatus).toBe('DISCREPANCY');
      expect(result.difference).toBe(500);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      // Order paymentStatus must NOT be updated to PAID
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should reject duplicate settlement on an already reconciled order with different reference', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '3500',
        currency: 'PKR',
        paymentStatus: PaymentStatus.PAID,
        payments: [
          {
            id: 'pay-cod-1',
            paymentMethod: 'COD',
            amount: '3500',
            status: PaymentStatus.PAID,
            transactionReference: 'ORIGINAL-REMIT-123',
            metadata: JSON.stringify({ reconciliationStatus: 'SETTLED' }),
          },
        ],
      });

      const admin = { id: 'admin-1', username: 'superadmin' } as any;

      await expect(
        codSettlementService.recordRemittance(
          'order-1',
          {
            remittanceReference: 'NEW-DUPLICATE-REMIT-456',
            amountReceived: 3500,
          },
          admin,
        ),
      ).rejects.toThrow('already settled and reconciled');
    });

    it('should handle duplicate settlement with same reference idempotently', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '3500',
        currency: 'PKR',
        paymentStatus: PaymentStatus.PAID,
        payments: [
          {
            id: 'pay-cod-1',
            paymentMethod: 'COD',
            amount: '3500',
            status: PaymentStatus.PAID,
            transactionReference: 'SAME-REMIT-123',
            metadata: JSON.stringify({ reconciliationStatus: 'SETTLED' }),
          },
        ],
      });

      const admin = { id: 'admin-1', username: 'superadmin' } as any;

      const result = await codSettlementService.recordRemittance(
        'order-1',
        {
          remittanceReference: 'SAME-REMIT-123',
          amountReceived: 3500,
        },
        admin,
      );

      expect(result.reconciliationStatus).toBe('SETTLED');
      expect(result.paymentId).toBe('pay-cod-1');
      expect(result.difference).toBe(0);
    });
  });

  describe('3. Admin Shipping Service & Lifecycle Safety', () => {
    let adminShippingService: AdminShippingService;

    beforeEach(() => {
      adminShippingService = new AdminShippingService(
        mockPrisma,
        mockAudit,
        courierRegistry,
        codSettlementService,
      );
    });

    it('should reject booking shipment on a cancelled order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-cancelled',
        orderNumber: 'ORD-2026-9999',
        status: OrderStatus.CANCELLED,
        customer: { firstName: 'Zain', lastName: 'Malik' },
        payments: [],
      });

      await expect(
        adminShippingService.createShipment(
          {
            orderId: 'order-cancelled',
            carrier: 'TCS',
            trackingNumber: 'TCS12345678',
          },
          { id: 'admin-1', username: 'admin' } as any,
        ),
      ).rejects.toThrow('Cannot book a shipment for a cancelled order');
    });

    it('should reject duplicate active shipment on the same order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        status: OrderStatus.CONFIRMED,
        shippingAddress: 'Main Boulevard, Lahore',
        customer: { firstName: 'Zain', lastName: 'Malik' },
        payments: [],
      });

      mockPrisma.shipment.findFirst.mockResolvedValue({
        id: 'shipment-existing',
        carrier: 'TCS Express Pakistan',
        trackingNumber: 'TCS99887766',
        status: ShippingStatus.IN_TRANSIT,
      });

      await expect(
        adminShippingService.createShipment(
          {
            orderId: 'order-1',
            carrier: 'TCS',
            trackingNumber: 'TCS55443322',
          },
          { id: 'admin-1', username: 'admin' } as any,
        ),
      ).rejects.toThrow('already has an active shipment');
    });

    it('should successfully book a manual shipment and transition order to SHIPPED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        status: OrderStatus.CONFIRMED,
        total: '2500',
        shippingAddress: 'Blue Area, Islamabad',
        customer: { firstName: 'Hamza', lastName: 'Ali' },
        payments: [],
      });

      mockPrisma.shipment.findFirst.mockResolvedValue(null); // No active shipment
      mockPrisma.shipment.create.mockResolvedValue({
        id: 'new-shipment-1',
        orderId: 'order-1',
        carrier: 'Leopards Courier',
        trackingNumber: 'LEO88776655',
        trackingUrl: 'https://leopardscourier.com/tracking?track=LEO88776655',
        status: ShippingStatus.IN_TRANSIT,
        shippedDate: new Date(),
        notes: JSON.stringify({
          bookingMode: 'MANUAL',
          weightKg: 1.0,
          codAmount: 2500,
        }),
        order: { orderNumber: 'ORD-2026-0001' },
      });

      const result = await adminShippingService.createShipment(
        {
          orderId: 'order-1',
          carrier: 'LEOPARDS',
          trackingNumber: 'LEO88776655',
          weightKg: 1.0,
          destinationAddress: 'Blue Area, Islamabad',
          destinationCity: 'Islamabad',
        },
        { id: 'admin-1', username: 'admin' } as any,
      );

      expect(result.trackingNumber).toBe('LEO88776655');
      expect(result.carrier).toBe('Leopards Courier');
      expect(result.weightKg).toBe(1.0);
      expect(result.bookingMode).toBe('MANUAL');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.SHIPPED }),
        }),
      );
    });
  });

  describe('4. Order Lifecycle Transitions in AdminOrdersService', () => {
    let adminOrdersService: AdminOrdersService;

    beforeEach(() => {
      adminOrdersService = new AdminOrdersService(mockPrisma, mockAudit, codSettlementService);
    });

    it('should reject invalid lifecycle transitions (e.g., PENDING directly to DELIVERED)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        status: OrderStatus.PENDING,
        items: [],
      });

      await expect(
        adminOrdersService.updateOrderStatus(
          'order-1',
          { status: OrderStatus.DELIVERED },
          { id: 'admin-1', username: 'admin' } as any,
        ),
      ).rejects.toThrow('Invalid order status transition from PENDING to DELIVERED');
    });

    it('should reject modifying status of an already CANCELLED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        status: OrderStatus.CANCELLED,
        items: [],
      });

      await expect(
        adminOrdersService.updateOrderStatus(
          'order-1',
          { status: OrderStatus.CONFIRMED },
          { id: 'admin-1', username: 'admin' } as any,
        ),
      ).rejects.toThrow('Cannot change status of a cancelled order');
    });

    it('should allow valid transition from CONFIRMED to PROCESSING', async () => {
      let currentStatus = OrderStatus.CONFIRMED;
      const mockOrderData = {
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        total: '2000',
        paymentStatus: PaymentStatus.PENDING,
        customer: { firstName: 'Ali', lastName: 'Khan', email: 'ali@test.com' },
        items: [],
        payments: [],
        shipments: [],
        returns: [],
        commissions: [],
        statusHistory: [],
      };

      mockPrisma.order.findUnique.mockImplementation(async () => ({
        ...mockOrderData,
        status: currentStatus,
      }));

      mockPrisma.order.update.mockImplementation(async (params: any) => {
        if (params.data?.status) currentStatus = params.data.status;
        return { ...mockOrderData, status: currentStatus };
      });
      mockPrisma.orderStatusHistory.create.mockResolvedValue({});

      const updated = await adminOrdersService.updateOrderStatus(
        'order-1',
        { status: OrderStatus.PROCESSING, notes: 'Items packed in warehouse' },
        { id: 'admin-1', username: 'admin' } as any,
      );

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.PROCESSING }),
        }),
      );
      expect(updated.status).toBe(OrderStatus.PROCESSING);
    });
  });

  describe('5. Seller Authorization & Ownership Rules', () => {
    let sellerShippingService: SellerShippingService;

    beforeEach(() => {
      sellerShippingService = new SellerShippingService(mockPrisma, courierRegistry);
    });

    it('should reject seller shipment booking if order has no items from seller', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-other-seller',
        orderNumber: 'ORD-2026-5555',
        status: OrderStatus.CONFIRMED,
        items: [], // No items for seller-1
      });

      await expect(
        sellerShippingService.createShipment('seller-1', {
          orderId: 'order-other-seller',
          carrier: 'TCS',
          trackingNumber: 'TCS998877',
        }),
      ).rejects.toThrow('Order not found or does not contain items from your store');
    });

    it('should reject seller shipment booking if shipment already booked by that seller', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        status: OrderStatus.CONFIRMED,
        items: [{ id: 'item-1', sellerId: 'seller-1' }],
        customer: { firstName: 'Sara', lastName: 'Ahmed' },
      });

      mockPrisma.shipment.findFirst.mockResolvedValue({
        id: 'ship-1',
        trackingNumber: 'TCS-ALREADY-BOOKED',
        status: ShippingStatus.LABEL_CREATED,
        notes: JSON.stringify({ sellerId: 'seller-1' }),
      });

      await expect(
        sellerShippingService.createShipment('seller-1', {
          orderId: 'order-1',
          carrier: 'TCS',
          trackingNumber: 'TCS-NEW-NUMBER',
        }),
      ).rejects.toThrow('A shipment has already been booked for this order');
    });
  });
});
