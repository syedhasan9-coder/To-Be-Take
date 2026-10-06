import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginPage from './page';

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

const mockSuperAdminLoginSuccessResponse = {
  success: true,
  message: 'Login successful',
  data: {
    id: 'superadmin-uuid-12345',
    username: 'superadmin',
    email: 'superadmin@tobetake.dev',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'Super Admin',
    roleCode: 'SPADMIN',
    departmentId: 1,
    department: 'Administration',
    designation: 'System Administrator',
    status: 'ACTIVE',
    isEmailVerified: true,
    isMobileVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

const mockAdminLoginSuccessResponse = {
  success: true,
  message: 'Login successful',
  data: {
    id: 'admin-uuid-67890',
    username: 'admin_tariq',
    email: 'tariq.admin@tobetake.dev',
    firstName: 'Tariq',
    lastName: 'Mehmood',
    role: 'Admin',
    roleCode: 'ADMIN',
    departmentId: 1,
    department: 'Administration',
    designation: 'Operations Lead',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('AdminLoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  // 1. Rendering Tests
  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, branding sidebar, and login inputs', () => {
      render(<AdminLoginPage />);

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
      expect(screen.getByText('Platform Administration')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /admin portal/i })).toBeInTheDocument();
      expect(
        screen.getByText(/secure access for platform administrators and system management/i),
      ).toBeInTheDocument();

      // Form header & fields
      expect(
        screen.getByRole('heading', { name: /admin \/ super admin sign in/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/username or work email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username or email address')).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: /sign in to admin portal/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create admin account/i })).toHaveAttribute(
        'href',
        '/register/admin',
      );
    });
  });

  // 2. Input Interaction & Show/Hide Password Tests
  describe('Input Interactions', () => {
    it('should update identifier and password values when typed', async () => {
      render(<AdminLoginPage />);

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      const passwordInput = screen.getByPlaceholderText('Enter password');

      await userEvent.type(identifierInput, 'superadmin');
      await userEvent.type(passwordInput, 'SuperAdmin@2026!');

      expect(identifierInput).toHaveValue('superadmin');
      expect(passwordInput).toHaveValue('SuperAdmin@2026!');
    });

    it('should toggle password visibility when show/hide button is clicked', async () => {
      render(<AdminLoginPage />);

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

  // 3. Client-Side Validation Tests
  describe('Form Validation', () => {
    it('should show required validation errors when submitting empty form', async () => {
      render(<AdminLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in to admin portal/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();
      expect(await screen.findByText('Password is required.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear field validation error when user begins correcting the field', async () => {
      render(<AdminLoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in to admin portal/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Username or email is required.')).toBeInTheDocument();

      const identifierInput = screen.getByPlaceholderText('Enter username or email address');
      await userEvent.type(identifierInput, 'admin_user');

      await waitFor(() => {
        expect(screen.queryByText('Username or email is required.')).not.toBeInTheDocument();
      });
    });
  });

  // 4. API Authentication & Role Redirect Tests
  describe('API Authentication Flow', () => {
    it('should successfully log in Super Admin, store safe user info, and redirect to /admin/dashboard', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuperAdminLoginSuccessResponse,
      });

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'superadmin',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'SuperAdmin@2026!');

      const submitButton = screen.getByRole('button', { name: /sign in to admin portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: 'superadmin',
              password: 'SuperAdmin@2026!',
              portal: 'admin',
              requiredRole: 'ADMIN',
            }),
          }),
        );
      });

      // Verify no client-supplied arbitrary role override is sent
      const requestPayload = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body as string,
      );
      expect(requestPayload.role).toBeUndefined();

      // Verify redirect to admin dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });

      // Verify safe session storage data
      const stored = JSON.parse(sessionStorage.getItem('tobetake_auth_user') || '{}');
      expect(stored.username).toBe('superadmin');
      expect(stored.role).toBe('Super Admin');
      expect(stored.roleCode).toBe('SPADMIN');
      expect(stored.password).toBeUndefined();
      expect(stored.passwordHash).toBeUndefined();
    });

    it('should successfully log in Admin with work email and redirect to /admin/dashboard', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAdminLoginSuccessResponse,
      });

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'tariq.admin@tobetake.dev',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'Password123!');

      fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should disable submit button and show loading spinner during login request', async () => {
      let resolveFetch!: (value: unknown) => void;
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'superadmin',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'SuperAdmin@2026!');

      fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }));

      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();

      // Complete fetch
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => mockSuperAdminLoginSuccessResponse,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });

  // 5. Error Handling Tests
  describe('Error Handling', () => {
    it('should display user-friendly error message on 401 Unauthorized invalid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Invalid credentials.',
        }),
      });

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'superadmin',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'WrongPassword!');

      fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }));

      expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display server error message on 500 status code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Internal server error occurred.',
        }),
      });

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'superadmin',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'SuperAdmin@2026!');

      fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }));

      expect(await screen.findByText('Internal server error occurred.')).toBeInTheDocument();
    });

    it('should display network error message when fetch rejects', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      render(<AdminLoginPage />);

      await userEvent.type(
        screen.getByPlaceholderText('Enter username or email address'),
        'superadmin',
      );
      await userEvent.type(screen.getByPlaceholderText('Enter password'), 'SuperAdmin@2026!');

      fireEvent.click(screen.getByRole('button', { name: /sign in to admin portal/i }));

      expect(
        await screen.findByText(
          /unable to connect to the server\. please check your network connection/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
