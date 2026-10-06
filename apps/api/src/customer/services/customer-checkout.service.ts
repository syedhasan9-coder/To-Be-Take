import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import {
  PrismaService,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ShippingStatus,
} from '@tobetake/database';
import {
  CheckoutPreviewData,
  PlaceOrderInput,
  OrderPlacementResponse,
  CheckoutPreviewInput,
} from '@tobetake/shared-types';

@Injectable()
export class CustomerCheckoutService {
  private readonly logger = new Logger(CustomerCheckoutService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    // Resolve address
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

    // Validate stock and compute totals
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
    const trackingNumber = `TCS-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          status: OrderStatus.CONFIRMED,
          paymentStatus: input.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PAID,
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

        // Decrement inventory
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

      // 3. Create Payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: 'PKR',
          paymentMethod: input.paymentMethod,
          status: input.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.PAID,
          transactionReference: `TXN-${input.paymentMethod}-${Date.now().toString().slice(-8)}`,
        },
      });

      // 4. Create Shipment
      await tx.shipment.create({
        data: {
          orderId: order.id,
          trackingNumber,
          carrier: 'TCS Express Pakistan',
          status: ShippingStatus.IN_TRANSIT,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        },
      });

      // 5. Create Customer Notification
      await tx.customerNotification.create({
        data: {
          userId,
          type: 'ORDER',
          title: `Order Confirmed: #${orderNumber}`,
          message: `Your order of PKR ${totalAmount.toLocaleString()} has been placed via ${input.paymentMethod}. Tracking: ${trackingNumber}.`,
          targetUrl: `/orders/${order.id}`,
        },
      });

      // 6. Clear User's Cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: totalAmount,
        currency: 'PKR',
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: input.paymentMethod,
        shippingAddress: resolvedAddressText,
        estimatedDelivery: input.shippingMethod === 'EXPRESS' ? '1 - 2 Business Days' : '2 - 3 Business Days',
        message: 'Your order has been confirmed and forwarded to the artisan for dispatch.',
      };
    });

    return result;
  }
}
