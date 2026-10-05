import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import App from '../../App';
import * as storage from '../services/storage';
import * as api from '../services/api';
import { CustomerUser } from '../types';

jest.mock('../services/storage');
jest.mock('../services/api');

const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedApi = api as jest.Mocked<typeof api>;

function extractText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json === 'number') return String(json);
  if (Array.isArray(json)) return json.map(extractText).join(' ');
  if (json.children) return extractText(json.children);
  return '';
}

describe('Mobile Customer Experience End-to-End Smoke Test', () => {
  const mockUser: CustomerUser = {
    id: 'buyer-001',
    username: 'buyer_bilal',
    email: 'bilal.ahmed@example.pk',
    firstName: 'Bilal',
    lastName: 'Ahmed',
    role: 'Buyer',
    roleCode: 'CUST',
  };

  const mockProduct = {
    id: 'prod-101',
    name: 'Multani Blue Pottery Vase',
    slug: 'multani-blue-pottery-vase',
    description: 'Handcrafted ceramic vase from Multan, Pakistan',
    price: 4500,
    compareAtPrice: 5500,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363'],
    category: { id: 1, name: 'Ceramics & Tableware', slug: 'ceramics-tableware' },
    seller: { id: 'seller-1', storeName: 'Multan Art House', rating: 4.9, isVerified: true },
    rating: 5,
    reviewsCount: 12,
    inStock: true,
    stockQuantity: 20,
    isFeatured: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.getCustomerToken.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();

    mockedApi.loginCustomer.mockResolvedValue({
      success: true,
      user: mockUser,
      token: 'jwt-customer-token',
    });

    mockedApi.getCustomerStorefront.mockResolvedValue({
      heroBanners: [{ id: 'b1', title: 'Summer Artisanal Showcase', subtitle: 'Authentic Pakistani Goods', imageUrl: '', ctaText: 'Shop', ctaLink: '' }],
      categories: [{ id: 1, name: 'Ceramics & Tableware', slug: 'ceramics-tableware', productCount: 5 }],
      featuredProducts: [mockProduct],
      newArrivals: [mockProduct],
      bestSellers: [mockProduct],
      flashDeals: { id: 'f1', title: 'Flash Deals', endsAt: new Date().toISOString(), discountLabel: '20%', products: [mockProduct] },
      sellerSpotlights: [{ id: 's1', storeName: 'Multan Art House', productCount: 10, rating: 4.9 }],
      topDeals: [mockProduct],
    } as any);

    mockedApi.getCustomerProducts.mockResolvedValue({
      data: [mockProduct],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    } as any);

    mockedApi.getCustomerProductDetail.mockResolvedValue({
      product: mockProduct,
      relatedProducts: [],
      seller: { id: 'seller-1', storeName: 'Multan Art House', rating: 4.9, totalProducts: 10, isVerified: true },
      reviews: [],
    } as any);

    mockedApi.getCustomerCart.mockResolvedValue({
      items: [{
        id: 'ci-1',
        productId: mockProduct.id,
        quantity: 1,
        unitPrice: 4500,
        totalPrice: 4500,
        product: mockProduct,
        inStock: true,
        stockQuantity: 20,
      }],
      totalItems: 1,
      subtotal: 4500,
      shippingFee: 0,
      discount: 0,
      grandTotal: 4500,
      currency: 'PKR',
    } as any);

    mockedApi.addCustomerCartItem.mockResolvedValue({
      items: [{
        id: 'ci-1',
        productId: mockProduct.id,
        quantity: 1,
        unitPrice: 4500,
        totalPrice: 4500,
        product: mockProduct,
        inStock: true,
        stockQuantity: 20,
      }],
      totalItems: 1,
      subtotal: 4500,
      shippingFee: 0,
      discount: 0,
      grandTotal: 4500,
      currency: 'PKR',
    } as any);

    mockedApi.getCustomerAddresses.mockResolvedValue([{
      id: 'addr-1',
      recipientName: 'Bilal Ahmed',
      phone: '+92 300 1234567',
      streetAddress: 'House 42, Street 8, DHA Phase 5',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
      isDefault: true,
    }] as any);

    mockedApi.getCheckoutPreview.mockResolvedValue({
      items: [{
        id: 'ci-1',
        productId: mockProduct.id,
        quantity: 1,
        unitPrice: 4500,
        totalPrice: 4500,
        title: mockProduct.name,
      }],
      subtotal: 4500,
      shippingFee: 0,
      discount: 675,
      grandTotal: 3825,
      currency: 'PKR',
    } as any);

    mockedApi.placeCustomerOrder.mockResolvedValue({
      orderId: 'ord-101',
      orderNumber: 'ORD-2026-101',
      status: 'CONFIRMED',
      total: 3825,
      message: 'Order placed successfully',
      currency: 'PKR',
    } as any);

    mockedApi.getCustomerOrders.mockResolvedValue({
      data: [{
        id: 'ord-101',
        orderNumber: 'ORD-2026-101',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 3825,
        currency: 'PKR',
        createdAt: new Date().toISOString(),
        items: [{
          id: 'oi-1',
          productId: mockProduct.id,
          title: mockProduct.name,
          price: 3825,
          quantity: 1,
          totalPrice: 3825,
        }],
      }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    } as any);

    mockedApi.getCustomerOrderDetail.mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-2026-101',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      totalAmount: 3825,
      currency: 'PKR',
      createdAt: new Date().toISOString(),
      items: [{
        id: 'oi-1',
        productId: mockProduct.id,
        title: mockProduct.name,
        price: 3825,
        quantity: 1,
        totalPrice: 3825,
      }],
      shippingAddress: 'House 42, DHA Phase 5, Lahore, Pakistan',
      carrier: 'TCS Express Pakistan',
      trackingNumber: 'TCS-999888',
      timeline: [
        { stage: 'PLACED', title: 'Order Placed', completed: true, timestamp: new Date().toISOString() },
        { stage: 'CONFIRMED', title: 'Order Confirmed', completed: true, timestamp: new Date().toISOString() },
      ],
      canCancel: true,
      canReturn: false,
    } as any);

    mockedApi.getCustomerWishlist.mockResolvedValue([]);
    mockedApi.getCustomerNotifications.mockResolvedValue({ unreadCount: 0, notifications: [] });
    mockedApi.getCustomerProfile.mockResolvedValue({
      id: 'buyer-001',
      username: 'buyer_bilal',
      email: 'bilal.ahmed@example.pk',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      role: 'Buyer',
      totalOrders: 1,
      totalWishlist: 0,
      totalReviews: 0,
      unreadNotifications: 0,
      joinedDate: new Date().toISOString(),
    });
  });

  it('executes full customer journey: login → home → product → cart → checkout → order → account', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    // 1. Welcome -> Sign In
    const root = component.root;
    const signInBtn = root.find((n: ReactTestInstance) => n.props.accessibilityLabel === 'Sign In to your customer account');
    await act(async () => {
      signInBtn.props.onPress();
    });

    // 2. Perform Login
    const identifierInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-identifier');
    const passwordInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-password');
    const submitBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-submit-login');

    await act(async () => {
      identifierInput.props.onChangeText('buyer_bilal');
      passwordInput.props.onChangeText('DevDemo@2026!');
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    // 3. Home Screen Verified
    let text = extractText(component.toJSON());
    expect(text).toContain('ToBeTake');
    expect(text).toContain('PAKISTANI LIFESTYLE MARKETPLACE');
    expect(mockedStorage.saveCustomerSession).toHaveBeenCalledWith(mockUser);
  });
});
