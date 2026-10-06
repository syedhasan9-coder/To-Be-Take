import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, ProductStatus, OrderStatus, PaymentStatus, ApprovalStatus, ReviewStatus } from '@tobetake/database';
import { PasswordService } from '../common/services/password.service';
import { CustomerStorefrontService } from './services/customer-storefront.service';
import { CustomerProductsService } from './services/customer-products.service';
import { CustomerCartService } from './services/customer-cart.service';
import { CustomerWishlistService } from './services/customer-wishlist.service';
import { CustomerAddressesService } from './services/customer-addresses.service';
import { CustomerCheckoutService } from './services/customer-checkout.service';
import { CustomerOrdersService } from './services/customer-orders.service';
import { CustomerReviewsService } from './services/customer-reviews.service';
import { CustomerNotificationsService } from './services/customer-notifications.service';
import { CustomerProfileService } from './services/customer-profile.service';

describe('Customer Marketplace Services', () => {
  let storefrontService: CustomerStorefrontService;
  let productsService: CustomerProductsService;
  let cartService: CustomerCartService;
  let wishlistService: CustomerWishlistService;
  let addressesService: CustomerAddressesService;
  let checkoutService: CustomerCheckoutService;
  let ordersService: CustomerOrdersService;
  let reviewsService: CustomerReviewsService;
  let notificationsService: CustomerNotificationsService;
  let profileService: CustomerProfileService;

  const mockProduct = {
    id: 'prod-001',
    name: 'Multani Blue Pottery Vase',
    slug: 'multani-blue-pottery-vase',
    sku: 'ART-CER-001',
    description: 'Authentic handcrafted Pakistani ceramic vase.',
    price: 4500,
    compareAtPrice: 5500,
    costPrice: 2800,
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600'],
    category: { id: 1, name: 'Ceramics', slug: 'ceramics', description: 'Ceramics', isActive: true, displayOrder: 1 },
    seller: { id: 'seller-1', username: 'vendor_artisan', email: 'artisan@tobetake.dev', storeName: 'Multan Art House', firstName: 'Tariq', lastName: 'Mahmood', createdAt: new Date() },
    reviews: [{ id: 'rev-1', rating: 5, comment: 'Exceptional craftsmanship', customer: { firstName: 'Bilal', lastName: 'Ahmed' }, createdAt: new Date() }],
    inventory: { id: 'inv-1', sku: 'ART-CER-001', stockQuantity: 20, reservedQuantity: 0, lowStockThreshold: 3, createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    category: {
      findMany: jest.fn().mockImplementation((args) => {
        if (args?.where?.parentId) {
          return Promise.resolve([
            { id: 2, name: 'Blue Pottery', slug: 'blue-pottery', parentId: args.where.parentId, isActive: true, displayOrder: 2, _count: { products: 3 } },
          ]);
        }
        return Promise.resolve([
          { id: 1, name: 'Ceramics', slug: 'ceramics', description: 'Handcrafted ceramics', parentId: null, isActive: true, displayOrder: 1, _count: { products: 5 } },
          { id: 2, name: 'Blue Pottery', slug: 'blue-pottery', description: 'Handcrafted blue pottery', parentId: 1, isActive: true, displayOrder: 2, _count: { products: 3 } },
        ]);
      }),
      findFirst: jest.fn().mockImplementation((args) => {
        if (args?.where?.OR) {
          const searchCond = args.where.OR.find((c: any) => c.slug || c.name);
          const val = searchCond?.slug || searchCond?.name?.contains || '';
          if (val === 'non-existent') return Promise.resolve(null);
        }
        return Promise.resolve({ id: 1, name: 'Ceramics', slug: 'ceramics', isActive: true });
      }),
    },
    product: {
      findMany: jest.fn().mockImplementation((args) => {
        if (args?.where?.categoryId === -999999) return Promise.resolve([]);
        return Promise.resolve([mockProduct]);
      }),
      findFirst: jest.fn().mockResolvedValue(mockProduct),
      findUnique: jest.fn().mockResolvedValue(mockProduct),
      count: jest.fn().mockImplementation((args) => {
        if (args?.where?.categoryId === -999999) return Promise.resolve(0);
        return Promise.resolve(1);
      }),
    },
    sellerApproval: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'appr-1',
          status: ApprovalStatus.APPROVED,
          seller: {
            id: 'seller-1',
            username: 'vendor_artisan',
            email: 'artisan@tobetake.dev',
            storeName: 'Multan Art House',
            firstName: 'Tariq',
            lastName: 'Mahmood',
            businessCategory: 'Ceramics',
            createdAt: new Date(),
            sellerProducts: [mockProduct],
          },
        },
      ]),
    },
    cartItem: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'cart-item-1',
          userId: 'user-001',
          productId: 'prod-001',
          quantity: 2,
          product: mockProduct,
          createdAt: new Date(),
        },
      ]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue({
        id: 'cart-item-1',
        userId: 'user-001',
        productId: 'prod-001',
        quantity: 2,
        product: mockProduct,
      }),
      upsert: jest.fn().mockResolvedValue({ id: 'cart-item-1', quantity: 2 }),
      update: jest.fn().mockResolvedValue({ id: 'cart-item-1', quantity: 3 }),
      delete: jest.fn().mockResolvedValue({ id: 'cart-item-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    wishlistItem: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'wish-1',
          userId: 'user-001',
          productId: 'prod-001',
          product: mockProduct,
          createdAt: new Date(),
        },
      ]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'wish-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'wish-1' }),
      count: jest.fn().mockResolvedValue(1),
    },
    userAddress: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'addr-1',
          userId: 'user-001',
          label: 'Home',
          recipientName: 'Bilal Ahmed',
          phone: '+92 300 1234567',
          streetAddress: 'House 42, Street 8, DHA Phase 5',
          area: 'DHA',
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
          country: 'Pakistan',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'addr-1',
        userId: 'user-001',
        label: 'Home',
        recipientName: 'Bilal Ahmed',
        phone: '+92 300 1234567',
        streetAddress: 'House 42, Street 8, DHA Phase 5',
        area: 'DHA',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: jest.fn().mockImplementation((args) => ({
        id: 'addr-new',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: jest.fn().mockImplementation((args) => ({
        id: args.where.id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 'addr-1' }),
      count: jest.fn().mockResolvedValue(1),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 'ORD-2026-1001',
          customerId: 'user-001',
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          currency: 'PKR',
          subtotal: 9000,
          shippingTotal: 0,
          taxTotal: 0,
          discountTotal: 0,
          total: 9000,
          createdAt: new Date(),
          shippingAddress: 'House 42, DHA Phase 5, Lahore, Pakistan',
          items: [{ id: 'item-1', productId: 'prod-001', productName: 'Multani Blue Pottery Vase', unitPrice: 4500, quantity: 2, totalPrice: 9000, product: mockProduct }],
          shipments: [{ trackingNumber: 'TCS-123456', carrier: 'TCS Express Pakistan', status: 'IN_TRANSIT' }],
          payments: [{ paymentMethod: 'COD', status: PaymentStatus.PENDING, amount: 9000 }],
          returns: [],
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-2026-1001',
        customerId: 'user-001',
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        currency: 'PKR',
        subtotal: 9000,
        shippingTotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        total: 9000,
        createdAt: new Date(),
        shippingAddress: 'House 42, DHA Phase 5, Lahore, Pakistan',
        items: [{ id: 'item-1', productId: 'prod-001', productName: 'Multani Blue Pottery Vase', unitPrice: 4500, quantity: 2, totalPrice: 9000, product: mockProduct }],
        shipments: [{ trackingNumber: 'TCS-123456', carrier: 'TCS Express Pakistan', status: 'IN_TRANSIT' }],
        payments: [{ paymentMethod: 'COD', status: PaymentStatus.PENDING, amount: 9000 }],
        returns: [],
      }),
      update: jest.fn().mockResolvedValue({ id: 'order-1', status: OrderStatus.CANCELLED }),
      count: jest.fn().mockResolvedValue(1),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-001',
        username: 'buyer_bilal',
        email: 'bilal.ahmed@example.pk',
        firstName: 'Bilal',
        lastName: 'Ahmed',
        phone: '+92 300 1234567',
        password: 'hashed_password',
        role: { name: 'Customer' },
        createdAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({ id: 'user-001' }),
    },
    customerNotification: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'notif-1', userId: 'user-001', type: 'ORDER', title: 'Order Placed', message: 'Confirmed', isRead: false, createdAt: new Date() },
      ]),
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(1),
    },
    productReview: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'rev-1',
        productId: 'prod-001',
        customerId: 'user-001',
        sellerId: 'seller-1',
        rating: 5,
        title: 'Great quality',
        comment: 'Great quality',
        status: ReviewStatus.APPROVED,
        customer: { firstName: 'Bilal', lastName: 'Ahmed' },
        product: mockProduct,
        createdAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({
        id: 'rev-1',
        rating: 5,
        title: 'Great quality',
        comment: 'Great quality',
        customer: { firstName: 'Bilal', lastName: 'Ahmed' },
        product: mockProduct,
        createdAt: new Date(),
      }),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback({
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'order-new',
            orderNumber: 'ORD-2026-9999',
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PENDING,
            total: 9000,
          }),
        },
        orderItem: {
          create: jest.fn().mockResolvedValue({ id: 'oi-1' }),
        },
        inventoryItem: {
          update: jest.fn().mockResolvedValue({ id: 'inv-1' }),
        },
        payment: {
          create: jest.fn().mockResolvedValue({ id: 'pay-1' }),
        },
        shipment: {
          create: jest.fn().mockResolvedValue({ id: 'ship-1' }),
        },
        userAddress: {
          create: jest.fn().mockResolvedValue({ id: 'addr-new' }),
        },
        customerNotification: {
          create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        },
        cartItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      });
    }),
  };

  const mockPasswordService = {
    hash: jest.fn().mockResolvedValue('hashed_pw'),
    compare: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerStorefrontService,
        CustomerProductsService,
        CustomerCartService,
        CustomerWishlistService,
        CustomerAddressesService,
        CustomerCheckoutService,
        CustomerOrdersService,
        CustomerReviewsService,
        CustomerNotificationsService,
        CustomerProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    storefrontService = module.get<CustomerStorefrontService>(CustomerStorefrontService);
    productsService = module.get<CustomerProductsService>(CustomerProductsService);
    cartService = module.get<CustomerCartService>(CustomerCartService);
    wishlistService = module.get<CustomerWishlistService>(CustomerWishlistService);
    addressesService = module.get<CustomerAddressesService>(CustomerAddressesService);
    checkoutService = module.get<CustomerCheckoutService>(CustomerCheckoutService);
    ordersService = module.get<CustomerOrdersService>(CustomerOrdersService);
    reviewsService = module.get<CustomerReviewsService>(CustomerReviewsService);
    notificationsService = module.get<CustomerNotificationsService>(CustomerNotificationsService);
    profileService = module.get<CustomerProfileService>(CustomerProfileService);
  });

  describe('Storefront & Catalog', () => {
    it('should return complete storefront data in PKR with aggregate category counts', async () => {
      const data = await storefrontService.getStorefrontData();
      expect(data.heroBanners).toBeDefined();
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.featuredProducts.length).toBeGreaterThan(0);
      expect(data.featuredProducts[0].price).toBe(4500);
      // Parent category count should aggregate direct (5) + child (3) = 8
      const parentCat = data.categories.find((c) => c.slug === 'ceramics');
      expect(parentCat?.productCount).toBe(8);
    });

    it('should query products with filtering and pagination', async () => {
      const result = await productsService.findProducts({ page: 1, limit: 12, search: 'Vase' });
      expect(result.products.length).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should query all products when category is all or empty', async () => {
      const resultAll = await productsService.findProducts({ categorySlug: 'all' });
      expect(resultAll.products.length).toBeGreaterThan(0);

      const resultEmpty = await productsService.findProducts({ categorySlug: '' });
      expect(resultEmpty.products.length).toBeGreaterThan(0);
    });

    it('should filter products by category slug including child subcategories', async () => {
      const result = await productsService.findProducts({ categorySlug: 'ceramics' });
      expect(result.products.length).toBe(1);
      expect(result.availableCategories.length).toBe(2);
      expect(result.availableCategories[0].count).toBe(8); // Aggregate count 5+3
    });

    it('should filter products by category alias', async () => {
      const result = await productsService.findProducts({ category: 'pottery' });
      expect(result.products.length).toBe(1);
    });

    it('should handle search + category combination correctly', async () => {
      const result = await productsService.findProducts({ search: 'Pottery', categorySlug: 'ceramics' });
      expect(result.products.length).toBe(1);
    });

    it('should handle non-existent / empty category gracefully with 0 results', async () => {
      const result = await productsService.findProducts({ categorySlug: 'non-existent' });
      expect(result.products.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should get detailed product with seller and reviews', async () => {
      const product = await productsService.getProductByIdOrSlug('multani-blue-pottery-vase');
      expect(product.name).toBe('Multani Blue Pottery Vase');
      expect(product.price).toBe(4500);
    });
  });

  describe('Shopping Cart & Wishlist', () => {
    it('should calculate cart total with free shipping above 3000 PKR', async () => {
      const cart = await cartService.getCart('user-001');
      expect(cart.totalItems).toBe(2);
      expect(cart.subtotal).toBe(9000);
      expect(cart.shippingFee).toBe(0); // Above 3000 PKR threshold
      expect(cart.grandTotal).toBe(9000);
    });

    it('should toggle wishlist item', async () => {
      const result = await wishlistService.toggleWishlist('user-001', 'prod-001');
      expect(result.wishlisted).toBe(true);
      expect(result.items.length).toBe(1);
    });
  });

  describe('Addresses & Checkout Flow', () => {
    it('should calculate checkout preview with discount code', async () => {
      const preview = await checkoutService.getCheckoutPreview('user-001', { couponCode: 'PAKISTAN15' });
      expect(preview.subtotal).toBe(9000);
      expect(preview.discount).toBe(1350); // 15% of 9000
      expect(preview.grandTotal).toBe(7650);
    });

    it('should place order with Pakistani phone and COD payment method', async () => {
      const order = await checkoutService.placeOrder('user-001', {
        shippingAddress: {
          recipientName: 'Bilal Ahmed',
          phone: '+92 300 1234567',
          streetAddress: 'House 42, Street 8, DHA Phase 5',
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
        },
        paymentMethod: 'COD',
      });

      expect(order.orderNumber).toBeDefined();
      expect(order.total).toBe(9000);
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('Customer Orders & Account', () => {
    it('should return orders with tracking and 6-stage timeline', async () => {
      const orders = await ordersService.getCustomerOrders('user-001');
      expect(orders.length).toBe(1);
      expect(orders[0].carrier).toBe('TCS Express Pakistan');
      expect(orders[0].canCancel).toBe(true);
    });

    it('should fetch customer profile with summary statistics', async () => {
      const profile = await profileService.getProfile('user-001');
      expect(profile.username).toBe('buyer_bilal');
      expect(profile.totalOrders).toBe(1);
    });
  });
});
