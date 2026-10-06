import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerLoginPage from './page';

// Mock Next.js useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockSellerLoginSuccessResponse = {
  success: true,
  message: 'Login successful',
  data: {
    id: 'seller-uuid-12345',
    username: 'seller_fatima',
    email: 'fatima.seller@tobetake.dev',
    firstName: 'Fatima',
    lastName: 'Khan',
    role: 'Seller',
    roleCode: 'VENDOR',
    storeName: 'Fatima Boutique',
    businessCategory: 'Fashion & Apparel',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('SellerLoginPage Component (/login/seller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, branding sidebar, and login inputs', () => {
      render(<SellerLoginPage />);

      // Top auth navigation links
      expect(screen.getByRole('link', { name: /back to marketplace/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /back to sign in options/i })).toHaveAttribute(
        'href',
        '/login',
      );
      expect(screen.getByRole('link', { name: /customer sign in/i })).toHaveAttribute(
        'href',
        '/login/user',
      );

      // Verify customer storefront header is NOT rendered
      expect(screen.queryByPlaceholderText(/search products/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/all categories/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /wishlist/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /cart/i })).not.toBeInTheDocument();

      // Branding sidebar
      expect(screen.getByText('Seller Account')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /grow your store\./i })).toBeInTheDocument();
      expect(screen.getByText(/reach more customers, manage inventory/i)).toBeInTheDocument();

      // Form header & fields
      expect(screen.getByRole('heading', { name: /seller sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username or account email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username or email address')).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: /sign in as seller/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create seller account/i })).toHaveAttribute(
        'href',
        '/register/seller',
      );
    });
  });

  describe('Input Interactions & Password Toggle', () => {
    it('should update identifier and password values when typed', async () => {
      render(<SellerLoginPage />);

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      const passwordInput = screen.getByPlaceholderText('Enter password');

      await userEvent.type(identifierInput, 'seller_fatima');
      await userEvent.type(passwordInput, 'Password123!');

      expect(identifierInput).toHaveValue('seller_fatima');
      expect(passwordInput).toHaveValue('Password123!');
    });

    it('should toggle password visibility when show/hide button is clicked', async () => {
      render(<SellerLoginPage />);

      const passwordInput = screen.getByPlaceholderText('Enter password');
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should show required validation errors when submitting empty form', async () => {
      render(<SellerLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in as seller/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();
      expect(await screen.findByText('Password is required.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear validation error when user begins typing in field', async () => {
      render(<SellerLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in as seller/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      await userEvent.type(identifierInput, 'seller_fatima');

      await waitFor(() => {
        expect(screen.queryByText('Username or email is required.')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Authentication Flow & Role Redirect', () => {
    it('should successfully log in Seller, store safe user info, and redirect to /seller/dashboard', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSellerLoginSuccessResponse,
      });

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'seller_fatima',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /sign in as seller/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: 'seller_fatima',
              password: 'Password123!',
              portal: 'seller',
              requiredRole: 'VENDOR',
            }),
          }),
        );
      });

      // Verify redirect to /seller/dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/seller/dashboard');
      });

      // Verify safe session storage data
      const stored = JSON.parse(sessionStorage.getItem('tobetake_auth_user') || '{}');
      expect(stored.username).toBe('seller_fatima');
      expect(stored.role).toBe('Seller');
      expect(stored.roleCode).toBe('VENDOR');
      expect(stored.storeName).toBe('Fatima Boutique');
      expect(stored.password).toBeUndefined();
      expect(stored.passwordHash).toBeUndefined();
    });

    it('should reject and not navigate when non-VENDOR role is returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          data: {
            id: 'admin-uuid',
            username: 'admin_user',
            role: 'Admin',
            roleCode: 'ADMIN',
          },
        }),
      });

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'admin_user',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /sign in as seller/i });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText('Access denied. Only authorized Seller/Vendor accounts can sign in here.'),
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('tobetake_auth_user')).toBeNull();
    });

    it('should disable submit button and show loading spinner during login request', async () => {
      let resolveFetch!: (value: unknown) => void;
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'seller_fatima',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as seller/i }));

      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();

      // Complete fetch
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => mockSellerLoginSuccessResponse,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/seller/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error banner on 401 Unauthorized invalid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Invalid credentials.',
        }),
      });

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'seller_fatima',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'WrongPassword!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as seller/i }));

      expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display error banner when server denies access to non-seller account', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Access denied. Seller account required.',
        }),
      });

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'admin_sarah',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as seller/i }));

      expect(await screen.findByText('Access denied. Seller account required.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('tobetake_auth_user')).toBeNull();
    });

    it('should display network error message when fetch rejects', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      render(<SellerLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'seller_fatima',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as seller/i }));

      expect(
        await screen.findByText(
          /unable to connect to the server\. please check your network connection/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
