import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService, ProductStatus } from '@tobetake/database';
import {
  CustomerCartSummary,
  CustomerCartItem,
  AddToCartInput,
  UpdateCartItemInput,
} from '@tobetake/shared-types';

@Injectable()
export class CustomerCartService {
  private readonly logger = new Logger(CustomerCartService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CustomerCartSummary> {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            inventory: true,
            seller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const cartItems: CustomerCartItem[] = items.map((item) => {
      const p = item.product;
      const rawImages = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
      const images = rawImages.map(String);
      const mainImage = images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400';
      const price = Number(p.price) || 0;
      const compareAtPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
      const stock = p.inventory ? Number(p.inventory.stockQuantity) : 0;
      const isAvailable = p.status === ProductStatus.ACTIVE && !p.isDeleted && stock > 0;

      return {
        id: item.id,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        sku: p.sku,
        image: mainImage,
        price,
        compareAtPrice,
        quantity: item.quantity,
        stockQuantity: stock,
        inStock: isAvailable,
        itemTotal: price * item.quantity,
        sellerName: `${p.seller?.firstName} ${p.seller?.lastName}`,
        storeName: p.seller?.storeName || `${p.seller?.firstName} ${p.seller?.lastName}` || 'ToBeTake Merchant',
      };
    });

    const availableItems = cartItems.filter((i) => i.inStock);
    const subtotal = availableItems.reduce((acc, curr) => acc + curr.itemTotal, 0);
    const totalItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

    // Free shipping in Pakistan if subtotal >= 3000 PKR, else 200 PKR
    const shippingFee = subtotal > 0 && subtotal >= 3000 ? 0 : (subtotal > 0 ? 200 : 0);
    const discount = 0;
    const grandTotal = Math.max(0, subtotal + shippingFee - discount);

    return {
      items: cartItems,
      totalItems,
      subtotal,
      shippingFee,
      discount,
      couponCode: null,
      grandTotal,
      currency: 'PKR',
    };
  }

  async addToCart(userId: string, input: AddToCartInput): Promise<CustomerCartSummary> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: { inventory: true },
    });

    if (!product || product.isDeleted || product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException('Product not found or unavailable for purchase.');
    }

    const availableStock = product.inventory ? Number(product.inventory.stockQuantity) : 0;
    const requestedQty = Math.max(1, input.quantity || 1);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: input.productId,
        },
      },
    });

    const newTotalQty = (existingItem?.quantity || 0) + requestedQty;

    if (newTotalQty > availableStock) {
      throw new BadRequestException(`Cannot add ${requestedQty} items. Only ${availableStock} in stock.`);
    }

    await this.prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: input.productId,
        },
      },
      update: {
        quantity: newTotalQty,
      },
      create: {
        userId,
        productId: input.productId,
        quantity: requestedQty,
      },
    });

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, itemId: string, input: UpdateCartItemInput): Promise<CustomerCartSummary> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: { include: { inventory: true } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    if (input.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return this.getCart(userId);
    }

    const availableStock = item.product.inventory ? Number(item.product.inventory.stockQuantity) : 0;

    if (input.quantity > availableStock) {
      throw new BadRequestException(`Requested quantity exceeds available stock (${availableStock}).`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CustomerCartSummary> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CustomerCartSummary> {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return this.getCart(userId);
  }
}
