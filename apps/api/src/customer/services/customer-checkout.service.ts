import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import {
  PrismaService,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from '@tobetake/database';
import {
  CheckoutPreviewData,
  PlaceOrderInput,
  OrderPlacementResponse,
  CheckoutPreviewInput,
} from '@tobetake/shared-types';
import { EasypaisaService } from '../../payments/services/easypaisa.service';

const UNSUPPORTED_ONLINE_METHODS = ['JAZZCASH', 'RAAST', 'BANK_TRANSFER'] as const;

@Injectable()
export class CustomerCheckoutService {
  private readonly logger = new Logger(CustomerCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly easypaisaService: EasypaisaService,
  ) {}

  async getCheckoutPreview(userId: string, input?: CheckoutPreviewInput): Promise<CheckoutPreviewData> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });

    let subtotal = 0;
    let itemsCount = 0;

    for (const item of cartItems) {
      const p = item.product;
      const stock = p.inventory ? Number(p.inventory.stockQuantity) : 0;
      if (p.status === ProductStatus.ACTIVE && !p.isDeleted && stock >= item.quantity) {
        subtotal += Number(p.price) * item.quantity;
        itemsCount += item.quantity;
      }
    }

    const shippingMethod = input?.shippingMethod || 'STANDARD';
    let baseShipping = subtotal >= 3000 ? 0 : (subtotal > 0 ? 200 : 0);
    if (shippingMethod === 'EXPRESS' && subtotal > 0) {
      baseShipping += 150;
    }

    let discount = 0;
    let couponApplied: string | null = null;
    const coupon = input?.couponCode?.trim().toUpperCase();

    if (coupon === 'PAKISTAN15') {
      discount = Math.round(subtotal * 0.15);
      couponApplied = 'PAKISTAN15 (15% Off)';
    } else if (coupon === 'WELCOME10') {
      discount = Math.round(subtotal * 0.10);
      couponApplied = 'WELCOME10 (10% Off)';
    }

    const grandTotal = Math.max(0, subtotal + baseShipping - discount);
    const estimatedDelivery = shippingMethod === 'EXPRESS' ? '1 - 2 Business Days' : '2 - 3 Business Days';

    return {
      subtotal,
      shippingFee: baseShipping,
      discount,
      grandTotal,
      currency: 'PKR',
      itemsCount,
      couponApplied,
      estimatedDelivery,
    };
  }

  async placeOrder(userId: string, input: PlaceOrderInput): Promise<OrderPlacementResponse> {
    // 1. Reject unsupported payment methods server-side
    if ((UNSUPPORTED_ONLINE_METHODS as readonly string[]).includes(input.paymentMethod)) {
      throw new BadRequestException(
        `Payment method '${input.paymentMethod}' is currently unavailable. ` +
          'Genuine merchant integration is pending verification. Please select Cash on Delivery (COD).',
      );
    }

    // 2. Validate Easypaisa configuration if selected
    if (input.paymentMethod === 'EASYPAISA') {
      if (!this.easypaisaService.isConfigured()) {
        throw new BadRequestException(
          'Easypaisa payment gateway is currently unconfigured. Real merchant credentials (EASYPAISA_STORE_ID, EASYPAISA_HASH_KEY) ' +
            'must be configured in environment variables. Please select Cash on Delivery (COD).',
        );
      }
    }

    const isCod = input.paymentMethod === 'COD';

    // 3. Load user cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            inventory: true,
            seller: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Your shopping cart is empty. Please add items before checkout.');
    }

    // 4. Resolve address
    let resolvedAddressText = '';
    if (input.addressId) {
      const addr = await this.prisma.userAddress.findFirst({
        where: { id: input.addressId, userId },
      });
      if (addr) {
        resolvedAddressText = `${addr.recipientName}, ${addr.phone}, ${addr.streetAddress}, ${addr.area || ''}, ${addr.city}, ${addr.province}, ${addr.postalCode}, Pakistan`;
      }
    }

    if (!resolvedAddressText && input.shippingAddress) {
      const sa = input.shippingAddress;
      resolvedAddressText = `${sa.recipientName}, ${sa.phone}, ${sa.streetAddress}, ${sa.area || ''}, ${sa.city}, ${sa.province}, ${sa.postalCode || '54000'}, Pakistan`;
    }

    if (!resolvedAddressText) {
      throw new BadRequestException('A valid Pakistani shipping address is required to place an order.');
    }

    // 5. Validate stock and compute totals
    let subtotal = 0;
    for (const item of cartItems) {
      const p = item.product;
      if (p.status !== ProductStatus.ACTIVE || p.isDeleted) {
        throw new BadRequestException(`Product "${p.name}" is no longer available.`);
      }
      const stock = p.inventory ? Number(p.inventory.stockQuantity) : 0;
      if (stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${p.name}". Available: ${stock}.`);
      }
      subtotal += Number(p.price) * item.quantity;
    }

    const shippingFee = input.shippingMethod === 'EXPRESS' 
      ? (subtotal >= 3000 ? 150 : 350)
      : (subtotal >= 3000 ? 0 : 200);

    let discount = 0;
    if (input.couponCode && input.couponCode.toUpperCase() === 'PAKISTAN15') {
      discount = Math.round(subtotal * 0.15);
    } else if (input.couponCode && input.couponCode.toUpperCase() === 'WELCOME10') {
      discount = Math.round(subtotal * 0.10);
    }

    const totalAmount = Math.max(0, subtotal + shippingFee - discount);
    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const transactionReference = isCod
      ? `COD-${orderNumber}`
      : `EP-INIT-${orderNumber}-${Date.now().toString().slice(-6)}`;

    const estimatedDelivery =
      input.shippingMethod === 'EXPRESS' ? '1 - 2 Business Days' : '2 - 3 Business Days';

    // 6. Execute atomic database transaction
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order: COD orders are CONFIRMED; Online payments start PENDING
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          currency: 'PKR',
          subtotal,
          shippingTotal: shippingFee,
          taxTotal: 0,
          discountTotal: discount,
          total: totalAmount,
          shippingAddress: resolvedAddressText,
          customerNotes: input.customerNotes,
        },
      });

      // 2. Create Order Items & Decrement Inventory
      for (const item of cartItems) {
        const unitPrice = Number(item.product.price);
        const itemTotal = unitPrice * item.quantity;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            sellerId: item.product.sellerId,
            productName: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice,
            totalPrice: itemTotal,
          },
        });

        // Decrement inventory (holds inventory for committed order)
        if (item.product.inventory) {
          await tx.inventoryItem.update({
            where: { id: item.product.inventory.id },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // 3. Create Payment record in PENDING state (NEVER marked PAID without verification)
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: 'PKR',
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.PENDING,
          transactionReference,
        },
      });

      // 4. Initial Order Status History
      if (tx.orderStatusHistory) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: order.status,
            notes: isCod ? 'Order placed via Cash on Delivery' : 'Order placed, awaiting online payment verification',
            actorName: 'System Checkout',
          },
        });
      }

      // NOTE: No fabricated Shipment record is created at checkout.
      // Real shipments are created strictly when an admin/seller books with a courier.

      // 5. Customer Notification
      await tx.customerNotification.create({
        data: {
          userId,
          type: 'ORDER',
          title: `Order Placed: #${orderNumber}`,
          message: isCod
            ? `Your order of PKR ${totalAmount.toLocaleString()} has been placed via Cash on Delivery (COD). Estimated delivery: ${estimatedDelivery}.`
            : `Your order of PKR ${totalAmount.toLocaleString()} has been created. Awaiting Easypaisa online payment completion.`,
          targetUrl: `/orders/${order.id}`,
        },
      });

      // 6. For COD orders, clear cart immediately.
      // For online payments, cart will be cleared once payment callback succeeds.
      if (isCod) {
        await tx.cartItem.deleteMany({
          where: { userId },
        });
      }

      return order;
    });

    // 7. If online payment (Easypaisa), initiate real gateway checkout
    let checkoutUrl: string | null = null;
    let checkoutPayload: Record<string, any> | null = null;

    if (!isCod && input.paymentMethod === 'EASYPAISA') {
      try {
        const initResult = await this.easypaisaService.initiatePayment({
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          amount: totalAmount,
          currency: 'PKR',
        });
        checkoutUrl = initResult.postUrl;
        checkoutPayload = initResult.params;
      } catch (err: any) {
        this.logger.error(`Easypaisa initiation failed for ${orderNumber}: ${err.message}`);
        // Update payment failure note
        await this.prisma.payment.updateMany({
          where: { orderId: createdOrder.id },
          data: {
            failureReason: `Gateway initiation error: ${err.message}`,
          },
        });
        throw err;
      }
    }

    return {
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      total: totalAmount,
      currency: 'PKR',
      status: createdOrder.status,
      paymentStatus: createdOrder.paymentStatus,
      paymentMethod: input.paymentMethod,
      shippingAddress: resolvedAddressText,
      estimatedDelivery,
      checkoutUrl,
      checkoutPayload,
      message: isCod
        ? 'Your order has been placed via Cash on Delivery and forwarded to fulfillment.'
        : 'Order created. Please proceed to Easypaisa to complete payment.',
    };
  }
}
