import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService, OrderStatus, PaymentStatus } from '@tobetake/database';
import { EasypaisaInitiateResponse, PaymentCallbackResult } from '@tobetake/shared-types';
import * as crypto from 'crypto';

export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
}

@Injectable()
export class EasypaisaService {
  private readonly logger = new Logger(EasypaisaService.name);

  private readonly storeId: string;
  private readonly hashKey: string;
  private readonly postUrl: string;
  private readonly sandboxMode: boolean;
  private readonly configuredCallbackUrl?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.storeId = this.configService.get<string>('EASYPAISA_STORE_ID', '').trim();
    this.hashKey = this.configService.get<string>('EASYPAISA_HASH_KEY', '').trim();
    this.sandboxMode =
      this.configService.get<string>('EASYPAISA_SANDBOX_MODE', 'true').toLowerCase() === 'true';

    const defaultPostUrl = this.sandboxMode
      ? 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf'
      : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';

    this.postUrl = this.configService.get<string>('EASYPAISA_POST_URL', defaultPostUrl).trim();
    this.configuredCallbackUrl = this.configService.get<string>('EASYPAISA_CALLBACK_URL', '').trim();
  }

  /**
   * Check if real merchant credentials exist in environment variables.
   * Never pretend payment works without genuine credentials.
   */
  isConfigured(): boolean {
    return (
      Boolean(this.storeId) &&
      Boolean(this.hashKey) &&
      this.storeId.length > 0 &&
      this.hashKey.length > 0 &&
      this.storeId !== 'mock_store' &&
      this.storeId !== 'change-me'
    );
  }

  /**
   * Generate HMAC-SHA256 signature for Easypaisa hosted checkout request.
   */
  generateRequestHash(params: Record<string, string>): string {
    if (!this.hashKey) {
      throw new BadRequestException('Easypaisa HASH_KEY is not configured.');
    }

    // Easypaisa standard: sort keys alphabetically and create query string
    const sortedKeys = Object.keys(params).sort();
    const sortedString = sortedKeys
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');

    return crypto.createHmac('sha256', this.hashKey).update(sortedString).digest('hex');
  }

  /**
   * Verify signature of callback/IPN from Easypaisa
   */
  verifySignature(payload: Record<string, any>): boolean {
    if (!this.isConfigured()) {
      return false;
    }

    const providedHash = payload.merchantHashedReq || payload.hash || payload.checksum;
    if (!providedHash) {
      this.logger.warn('Callback signature missing in payload');
      return false;
    }

    // Collect signature-relevant fields excluding hash fields
    const paramsToSign: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (!['merchantHashedReq', 'hash', 'checksum'].includes(k) && v !== undefined && v !== null) {
        paramsToSign[k] = String(v);
      }
    }

    const calculatedHash = this.generateRequestHash(paramsToSign);

    try {
      const providedBuffer = Buffer.from(String(providedHash), 'hex');
      const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
      if (providedBuffer.length !== calculatedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(providedBuffer, calculatedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Initiate Easypaisa Checkout
   */
  async initiatePayment(input: InitiatePaymentParams): Promise<EasypaisaInitiateResponse> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Easypaisa payment gateway is currently unconfigured. Missing EASYPAISA_STORE_ID or EASYPAISA_HASH_KEY. ' +
          'Real merchant credentials are required to initiate online payments. Please select Cash on Delivery (COD).',
      );
    }

    if (input.currency && input.currency.toUpperCase() !== 'PKR') {
      throw new BadRequestException('Easypaisa only accepts payments in Pakistani Rupee (PKR).');
    }

    const formattedAmount = Number(input.amount).toFixed(1);
    const now = new Date();
    // Expiry 2 hours from now formatted as YYYYMMDD HHMMSS
    const expiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const expiryDate =
      expiry.getFullYear().toString() +
      String(expiry.getMonth() + 1).padStart(2, '0') +
      String(expiry.getDate()).padStart(2, '0') +
      ' ' +
      String(expiry.getHours()).padStart(2, '0') +
      String(expiry.getMinutes()).padStart(2, '0') +
      String(expiry.getSeconds()).padStart(2, '0');

    const postBackURL =
      input.callbackUrl || this.configuredCallbackUrl || 'http://localhost:4000/api/payments/easypaisa/callback';

    const unsignedParams: Record<string, string> = {
      amount: formattedAmount,
      autoRedirect: '1',
      expiryDate,
      orderRefNum: input.orderNumber,
      paymentMethod: 'MA_PAYMENT_METHOD',
      postBackURL,
      storeId: this.storeId,
    };

    const merchantHashedReq = this.generateRequestHash(unsignedParams);

    return {
      postUrl: this.postUrl,
      params: {
        storeId: this.storeId,
        amount: formattedAmount,
        postBackURL,
        orderRefNum: input.orderNumber,
        expiryDate,
        autoRedirect: '1',
        paymentMethod: 'MA_PAYMENT_METHOD',
        merchantHashedReq,
      },
    };
  }

  /**
   * Process Easypaisa IPN or browser redirect callback
   */
  async processCallback(payload: Record<string, any>): Promise<PaymentCallbackResult> {
    this.logger.log(`Received Easypaisa callback for orderRefNum: ${payload.orderRefNum || payload.orderId}`);

    const orderRef = payload.orderRefNum || payload.orderId;
    if (!orderRef) {
      throw new BadRequestException('Missing orderRefNum in callback payload.');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: String(orderRef) }, { id: String(orderRef) }],
      },
      include: {
        payments: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with reference '${orderRef}' not found.`);
    }

    const payment =
      order.payments.find((p) => p.paymentMethod === 'EASYPAISA') || order.payments[0];

    if (!payment) {
      throw new NotFoundException(`Payment record for order '${order.orderNumber}' not found.`);
    }

    // Idempotency: If already marked PAID, return success without duplicate processing
    if (order.paymentStatus === PaymentStatus.PAID && payment.status === PaymentStatus.PAID) {
      this.logger.log(`Payment for order ${order.orderNumber} already marked PAID. Idempotent return.`);
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: PaymentStatus.PAID,
        message: 'Payment already processed and verified.',
        transactionReference: payment.transactionReference,
      };
    }

    // Authenticity check: if credentials are configured, signature must match
    if (this.isConfigured()) {
      const isValid = this.verifySignature(payload);
      if (!isValid) {
        this.logger.warn(`Signature verification failed for order ${order.orderNumber}`);
        throw new UnauthorizedException('Easypaisa callback authenticity verification failed.');
      }
    }

    // Verify amount
    if (payload.amount !== undefined) {
      const callbackAmount = Number(payload.amount);
      const expectedAmount = Number(order.total);
      if (isNaN(callbackAmount) || Math.abs(callbackAmount - expectedAmount) > 0.05) {
        this.logger.error(`Amount mismatch: expected ${expectedAmount}, received ${callbackAmount}`);

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: `Amount mismatch: expected ${expectedAmount}, got ${callbackAmount}`,
          },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.FAILED },
        });

        throw new BadRequestException('Transaction amount mismatch with order total.');
      }
    }

    const responseCode = String(payload.responseCode || payload.status || '');
    const isSuccess = responseCode === '0000' || responseCode === '000' || responseCode.toUpperCase() === 'SUCCESS';
    const txnId = payload.transactionId || payload.mpasTransactionId || `EP-${Date.now()}`;

    let currentMetadata: Record<string, any> = {};
    try {
      currentMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    } catch {
      currentMetadata = {};
    }

    const updatedMetadata = JSON.stringify({
      ...currentMetadata,
      gateway: 'EASYPAISA',
      gatewayTransactionId: txnId,
      rawCallback: payload,
      verifiedAt: new Date().toISOString(),
    });

    if (isSuccess) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update Payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            failureReason: null,
            metadata: updatedMetadata,
          },
        });

        // 2. Update Order
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            confirmedAt: new Date(),
          },
        });

        // 3. Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: OrderStatus.CONFIRMED,
            notes: `Online payment verified via Easypaisa IPN (Txn: ${txnId})`,
            actorName: 'Easypaisa Gateway',
          },
        });

        // 4. Clear Customer Cart for purchased items
        await tx.cartItem.deleteMany({
          where: { userId: order.customerId },
        });

        // 5. Customer Notification
        await tx.customerNotification.create({
          data: {
            userId: order.customerId,
            type: 'PAYMENT',
            title: `Payment Verified: #${order.orderNumber}`,
            message: `Your payment of PKR ${Number(order.total).toLocaleString()} via Easypaisa has been verified.`,
            targetUrl: `/orders/${order.id}`,
          },
        });
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: PaymentStatus.PAID,
        message: 'Payment verified and order confirmed successfully.',
        transactionReference: payment.transactionReference,
      };
    } else {
      const failureReason = payload.responseDesc || payload.message || 'Payment rejected or cancelled by user';

      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: String(failureReason),
            metadata: updatedMetadata,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });
      });

      return {
        success: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: PaymentStatus.FAILED,
        failureReason: String(failureReason),
        message: 'Payment was not successful.',
        transactionReference: payment.transactionReference,
      };
    }
  }
}
