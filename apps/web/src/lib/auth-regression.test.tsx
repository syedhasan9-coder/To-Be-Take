import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CustomerProvider, useCustomer } from '../components/customer/CustomerContext';
import { customerApi, setCustomerAuthToken, setCustomerStoredUser } from './customer-api';
import { getClientAuthState, sanitizeRedirectUrl } from './auth-routing';
import CheckoutPage from '../app/(public)/checkout/page';
import AccountLayout from '../app/(public)/account/layout';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/account',
}));

// Mock customerApi
jest.mock('./customer-api', () => {
  const actual = jest.requireActual('./customer-api');
  return {
    ...actual,
    customerApi: {
      getStorefront: jest.fn().mockResolvedValue({}),
      getCategories: jest.fn().mockResolvedValue([]),
      getProducts: jest.fn().mockResolvedValue({ products: [] }),
      getProductDetail: jest.fn().mockResolvedValue({
        id: 'prod-123',
        name: 'Handcrafted Ceramic Vase',
        slug: 'handcrafted-ceramic-vase',
        price: 2500,
        stockQuantity: 10,
        inStock: true,
      }),
      getCart: jest.fn().mockResolvedValue({
        items: [],
        totalItems: 0,
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        grandTotal: 0,
        currency: 'PKR',
      }),
      addToCart: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'cart-item-1',
            productId: 'prod-123',
            productName: 'Handcrafted Ceramic Vase',
            price: 2500,
            quantity: 1,
            itemTotal: 2500,
          },
        ],
        totalItems: 1,
        subtotal: 2500,
        shippingFee: 200,
        discount: 0,
        grandTotal: 2700,
        currency: 'PKR',
      }),
      getWishlist: jest.fn().mockResolvedValue([]),
      getNotifications: jest.fn().mockResolvedValue({ notifications: [], unreadCount: 0 }),
      getAddresses: jest.fn().mockResolvedValue([
        {
          id: 'addr-1',
          recipientName: 'Bilal Ahmed',
          phone: '+92 300 1234567',
          streetAddress: 'House 1, Street 2',
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
          isDefault: true,
          label: 'Home',
        },
      ]),
      getCheckoutPreview: jest.fn().mockResolvedValue({
        itemsCount: 1,
        subtotal: 2500,
        shippingFee: 200,
        discount: 0,
        grandTotal: 2700,
        currency: 'PKR',
      }),
      placeOrder: jest.fn().mockResolvedValue({ orderId: 'ord-999' }),
    },
  };
});

describe('Authentication & Buy Now Regression Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('CustomerContext Session Hydration & Buy Now Flow', () => {
    function TestConsumer() {
      const { user, token, isAuthenticated, isInitialized, buyNow, login, logout, cart } = useCustomer();
      return (
        <div>
          <span data-testid="isInitialized">{String(isInitialized)}</span>
          <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
          <span data-testid="userEmail">{user?.email || 'no-user'}</span>
          <span data-testid="token">{token || 'no-token'}</span>
          <span data-testid="cartCount">{cart?.totalItems || 0}</span>
          <button data-testid="buyNowBtn" onClick={() => buyNow('prod-123', 1)}>
            Buy Now
          </button>
          <button
            data-testid="loginBtn"
            onClick={() =>
              login('token-xyz', {
                id: 'buyer-1',
                email: 'olivia.chen@example.com',
                firstName: 'Olivia',
                lastName: 'Chen',
                username: 'olivia_c',
                role: 'Buyer',
                roleCode: 'CUST',
              })
            }
          >
            Login
          </button>
          <button data-testid="logoutBtn" onClick={logout}>
            Logout
          </button>
        </div>
      );
    }

    it('should hydrate saved session from localStorage on mount and set isInitialized to true', async () => {
      setCustomerAuthToken('saved-jwt-token');
      setCustomerStoredUser({
        id: 'user-101',
        username: 'test_user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Buyer',
        roleCode: 'CUST',
      });

      render(
        <CustomerProvider>
          <TestConsumer />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('isInitialized')).toHaveTextContent('true');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('userEmail')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('token')).toHaveTextContent('saved-jwt-token');
      });
    });

    it('should initialize with guest cart when unauthenticated', async () => {
      render(
        <CustomerProvider>
          <TestConsumer />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('isInitialized')).toHaveTextContent('true');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('userEmail')).toHaveTextContent('no-user');
      });
    });

    it('should redirect guest to /login/user?intent=checkout&redirect=/checkout when clicking Buy Now', async () => {
      render(
        <CustomerProvider>
          <TestConsumer />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('isInitialized')).toHaveTextContent('true');
      });

      await act(async () => {
        screen.getByTestId('buyNowBtn').click();
      });

      // Verify guest cart has item saved
      const guestCart = JSON.parse(localStorage.getItem('tobetake_guest_cart') || '{}');
      expect(guestCart.items).toHaveLength(1);
      expect(guestCart.items[0].productId).toBe('prod-123');
    });

    it('should continue to /checkout directly when signed-in customer clicks Buy Now', async () => {
      setCustomerAuthToken('active-token-123');
      setCustomerStoredUser({
        id: 'buyer-1',
        username: 'olivia_c',
        email: 'olivia.chen@example.com',
        firstName: 'Olivia',
        lastName: 'Chen',
        role: 'Buyer',
        roleCode: 'CUST',
      });

      render(
        <CustomerProvider>
          <TestConsumer />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      await act(async () => {
        screen.getByTestId('buyNowBtn').click();
      });

      expect(customerApi.addToCart).toHaveBeenCalledWith('prod-123', 1);
    });

    it('should merge guest cart into server cart upon customer login', async () => {
      // Simulate guest cart in localStorage
      localStorage.setItem(
        'tobetake_guest_cart',
        JSON.stringify({
          items: [
            {
              id: 'guest-1',
              productId: 'prod-guest-99',
              quantity: 2,
              price: 1500,
              itemTotal: 3000,
            },
          ],
          totalItems: 2,
          subtotal: 3000,
          grandTotal: 3000,
        }),
      );

      render(
        <CustomerProvider>
          <TestConsumer />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('isInitialized')).toHaveTextContent('true');
      });

      await act(async () => {
        screen.getByTestId('loginBtn').click();
      });

      expect(customerApi.addToCart).toHaveBeenCalledWith('prod-guest-99', 2);
      expect(localStorage.getItem('tobetake_guest_cart')).toBeNull();
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
  });

  describe('Checkout Page Authentication Protection', () => {
    it('should redirect unauthenticated guest to login when visiting checkout page', async () => {
      render(
        <CustomerProvider>
          <CheckoutPage />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login/user?intent=checkout&redirect=%2Fcheckout',
        );
      });
    });

    it('should render checkout content and load addresses for authenticated customer without redirecting', async () => {
      setCustomerAuthToken('valid-auth-token');
      setCustomerStoredUser({
        id: 'cust-1',
        username: 'bilal_ahmed',
        email: 'bilal@example.com',
        firstName: 'Bilal',
        lastName: 'Ahmed',
        role: 'Buyer',
        roleCode: 'CUST',
      });

      render(
        <CustomerProvider>
          <CheckoutPage />
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Complete Your Order')).toBeInTheDocument();
        expect(screen.getByText(/1\. Pakistani Delivery Address/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Account Layout Route Guard', () => {
    it('should redirect unauthenticated visitor to login with return path', async () => {
      render(
        <CustomerProvider>
          <AccountLayout>
            <div>Account Content</div>
          </AccountLayout>
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login/user?redirect=%2Faccount');
      });
    });

    it('should render account content for authenticated customer without redirecting to login', async () => {
      setCustomerAuthToken('valid-customer-token');
      setCustomerStoredUser({
        id: 'cust-1',
        username: 'olivia_c',
        email: 'olivia.chen@example.com',
        firstName: 'Olivia',
        lastName: 'Chen',
        role: 'Buyer',
        roleCode: 'CUST',
      });

      render(
        <CustomerProvider>
          <AccountLayout>
            <div data-testid="protected-content">Dashboard Protected Area</div>
          </AccountLayout>
        </CustomerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.getByText(/welcome back, Olivia!/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('auth-routing.ts Helpers', () => {
    it('should resolve client auth state for customer account', () => {
      setCustomerAuthToken('customer-jwt');
      setCustomerStoredUser({
        id: 'c-1',
        username: 'customer1',
        email: 'customer@test.com',
        role: 'Buyer',
        roleCode: 'CUST',
      });

      const state = getClientAuthState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isCustomer).toBe(true);
      expect(state.role).toBe('CUST');
      expect(state.isSeller).toBe(false);
      expect(state.isAdmin).toBe(false);
    });

    it('should sanitize redirect URLs and prevent open redirect attacks', () => {
      expect(sanitizeRedirectUrl('/checkout')).toBe('/checkout');
      expect(sanitizeRedirectUrl('/account/orders')).toBe('/account/orders');
      expect(sanitizeRedirectUrl('https://malicious.com', '/')).toBe('/');
      expect(sanitizeRedirectUrl('//malicious.com', '/')).toBe('/');
      expect(sanitizeRedirectUrl('javascript:alert(1)', '/')).toBe('/');
      expect(sanitizeRedirectUrl('/login/user', '/')).toBe('/');
    });
  });
});
