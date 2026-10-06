import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserLoginPage from './page';

// Mock Next.js useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock CustomerContext
jest.mock('../../../../components/customer/CustomerContext', () => ({
  useCustomer: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: false,
    user: null,
    cartCount: 0,
    wishlistCount: 0,
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

const mockBuyerLoginSuccessResponse = {
  success: true,
  message: 'Login successful',
  data: {
    id: 'buyer-uuid-12345',
    username: 'buyer_bilal',
    email: 'bilal.buyer@tobetake.dev',
    firstName: 'Bilal',
    lastName: 'Ahmed',
    role: 'Buyer',
    roleCode: 'CUST',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('UserLoginPage Component (/login/user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, branding sidebar, and login inputs', () => {
      render(<UserLoginPage />);

      // Back navigation link
      expect(screen.getByRole('link', { name: /back to sign in options/i })).toHaveAttribute(
        'href',
        '/login',
      );

      // Branding sidebar
      expect(screen.getByText('Buyer Account')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /shop & discover\./i })).toBeInTheDocument();
      expect(
        screen.getByText(/explore verified stores, discover unique products/i),
      ).toBeInTheDocument();

      // Form header & fields
      expect(screen.getByRole('heading', { name: /buyer sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username or account email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username or email address')).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: /sign in as buyer/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create buyer account/i })).toHaveAttribute(
        'href',
        '/register/user',
      );
    });
  });

  describe('Input Interactions & Password Toggle', () => {
    it('should update identifier and password values when typed', async () => {
      render(<UserLoginPage />);

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      const passwordInput = screen.getByPlaceholderText('Enter password');

      await userEvent.type(identifierInput, 'buyer_bilal');
      await userEvent.type(passwordInput, 'Password123!');

      expect(identifierInput).toHaveValue('buyer_bilal');
      expect(passwordInput).toHaveValue('Password123!');
    });

    it('should toggle password visibility when show/hide button is clicked', async () => {
      render(<UserLoginPage />);

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
      render(<UserLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in as buyer/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();
      expect(await screen.findByText('Password is required.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear validation error when user begins typing in field', async () => {
      render(<UserLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in as buyer/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      await userEvent.type(identifierInput, 'buyer_bilal');

      await waitFor(() => {
        expect(screen.queryByText('Username or email is required.')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Authentication Flow & Role Redirect', () => {
    it('should successfully log in Buyer, store safe user info, and redirect to /user/dashboard', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBuyerLoginSuccessResponse,
      });

      render(<UserLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'buyer_bilal',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /sign in as buyer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: 'buyer_bilal',
              password: 'Password123!',
              portal: 'user',
              requiredRole: 'CUST',
            }),
          }),
        );
      });

      // Verify redirect to /
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      // Verify safe session storage data
      const stored = JSON.parse(sessionStorage.getItem('tobetake_customer_user') || sessionStorage.getItem('tobetake_auth_user') || '{}');
      expect(stored.username).toBe('buyer_bilal');
      expect(stored.role).toBe('Buyer');
      expect(stored.roleCode).toBe('CUST');
      expect(stored.password).toBeUndefined();
      expect(stored.passwordHash).toBeUndefined();
    });

    it('should disable submit button and show loading spinner during login request', async () => {
      let resolveFetch!: (value: unknown) => void;
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );

      render(<UserLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'buyer_bilal',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as buyer/i }));

      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();

      // Complete fetch
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => mockBuyerLoginSuccessResponse,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
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

      render(<UserLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'buyer_bilal',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'WrongPassword!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as buyer/i }));

      expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display network error message when fetch rejects', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      render(<UserLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'buyer_bilal',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in as buyer/i }));

      expect(
        await screen.findByText(
          /unable to connect to the server\. please check your network connection/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
