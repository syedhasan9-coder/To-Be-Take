import { Injectable } from '@nestjs/common';
import { PrismaService } from '@tobetake/database';
import { AdminSearchResponse, AdminSearchResultItem } from '@tobetake/shared-types';

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Universal operational search across Orders, Customers, Sellers, and Products.
   */
  async search(rawQuery?: string): Promise<AdminSearchResponse> {
    const q = (rawQuery || '').trim();
    if (q.length < 2) {
      return {
        query: q,
        total: 0,
        results: [],
      };
    }

    const [orders, customers, sellers, products] = await Promise.all([
      // 1. Search Orders by Order Number
      this.prisma.order.findMany({
        where: {
          orderNumber: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),

      // 2. Search Customers (Buyers) by name, email, or username
      this.prisma.user.findMany({
        where: {
          role: { code: { in: ['CUST', 'CUSTOMER', 'BUYER'] } },
          isDeleted: false,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // 3. Search Sellers (Vendors) by store name, name, email, or username
      this.prisma.user.findMany({
        where: {
          role: { code: { in: ['VENDOR', 'VEND', 'SELLER'] } },
          isDeleted: false,
          OR: [
            { storeName: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // 4. Search Products by name or SKU
      this.prisma.product.findMany({
        where: {
          isDeleted: false,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          seller: { select: { storeName: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const results: AdminSearchResultItem[] = [];

    // Map Orders
    for (const ord of orders) {
      const customerName = ord.customer
        ? `${ord.customer.firstName || ''} ${ord.customer.lastName || ''}`.trim()
        : 'Customer';
      results.push({
        id: ord.id,
        type: 'order',
        title: ord.orderNumber,
        subtitle: `${customerName} • $${Number(ord.total || 0).toFixed(2)} • ${ord.status || 'PENDING'}`,
        badgeText: 'ORDER',
        status: ord.status,
        url: `/admin/orders/${ord.id}`,
      });
    }

    // Map Customers
    for (const cust of customers) {
      results.push({
        id: cust.id,
        type: 'customer',
        title: `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || cust.username,
        subtitle: `@${cust.username} • ${cust.email}`,
        badgeText: 'CUSTOMER',
        status: cust.status,
        url: `/admin/users/customers/${cust.id}`,
      });
    }

    // Map Sellers
    for (const seller of sellers) {
      results.push({
        id: seller.id,
        type: 'seller',
        title: seller.storeName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.username,
        subtitle: `@${seller.username} • ${seller.businessCategory || seller.email}`,
        badgeText: 'SELLER',
        status: seller.status,
        url: `/admin/users/sellers/${seller.id}`,
      });
    }

    // Map Products
    for (const prod of products) {
      results.push({
        id: prod.id,
        type: 'product',
        title: prod.name,
        subtitle: `SKU: ${prod.sku} • $${Number(prod.price || 0).toFixed(2)} • ${prod.category?.name || 'General'}`,
        badgeText: 'PRODUCT',
        status: prod.status,
        url: `/admin/products/${prod.id}`,
      });
    }

    return {
      query: q,
      total: results.length,
      results,
    };
  }
}
