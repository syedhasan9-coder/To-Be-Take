import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterAdminPage from './page';

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

const mockDepartmentsResponse = {
  success: true,
  data: [
    {
      id: 1,
      name: 'Administration',
      code: 'ADMN',
      description: 'Admin operations',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Vendor Management',
      code: 'VEND',
      description: 'Vendor operations',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  timestamp: new Date().toISOString(),
};

const mockRegisterAdminSuccessResponse = {
  success: true,
  message: 'Admin registered successfully',
  data: {
    id: 'admin-uuid-12345',
    username: 'admin_user',
    email: 'admin.user@tobetake.dev',
    firstName: 'Alex',
    lastName: 'Mercer',
    role: 'Admin',
    roleCode: 'ADMIN',
    departmentId: 1,
    department: 'Administration',
    designation: 'Platform Lead',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('RegisterAdminPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // 1. Rendering Tests
  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, and all form controls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      expect(screen.getByRole('heading', { name: /create admin account/i })).toBeInTheDocument();
      expect(
        screen.getByText(/set up your administrator account to manage your to be take workspace/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to to be take/i })).toHaveAttribute(
        'href',
        '/',
      );

      // Section headings
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Administrative Information')).toBeInTheDocument();

      // Form inputs
      expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^work email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
      expect(screen.getByLabelText(/^department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^designation/i)).toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/');
    });

    it('should not contain technical sprint or developer tracking badges', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      expect(screen.queryByText(/sprint/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/task \d/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/apps\/api/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/POST \/api/i)).not.toBeInTheDocument();
    });
  });

  // 2. Department API Handling
  describe('Department API Handling', () => {
    it('should load departments and select the first available department by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      const departmentSelect = screen.getByLabelText(/^department/i) as HTMLSelectElement;
      expect(departmentSelect.value).toBe('1');
    });

    it('should display friendly error alert and allow retry when department loading fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/unable to load the departments list/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByText(/unable to load the departments list/i)).not.toBeInTheDocument();
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });
    });
  });

  // 3. Password UX & Controls
  describe('Password UX & Show/Hide Controls', () => {
    it('should toggle password visibility when clicking Show/Hide buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText('Enter strong password');
      const toggleBtn = screen.getByRole('button', { name: /^show password$/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /^hide password$/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /^hide password$/i }));
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Test confirm password toggle
      const confirmInput = screen.getByPlaceholderText('Re-enter password');
      const confirmToggleBtn = screen.getByRole('button', { name: /^show confirm password$/i });

      expect(confirmInput).toHaveAttribute('type', 'password');
      fireEvent.click(confirmToggleBtn);
      expect(confirmInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /^hide confirm password$/i })).toBeInTheDocument();
    });

    it('should display compact password strength feedback when typing password', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText('Enter strong password');

      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();

      await user.type(passwordInput, 'Ab1');
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      expect(screen.getByText(/1 uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/1 lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/1 number/i)).toBeInTheDocument();

      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!');

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  // 4. Form Validation
  describe('Form Validation', () => {
    it('should show required validation errors when submitting an empty form', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      expect(screen.getByText('First name is required.')).toBeInTheDocument();
      expect(screen.getByText('Last name is required.')).toBeInTheDocument();
      expect(screen.getByText('Username is required.')).toBeInTheDocument();
      expect(screen.getByText('Work email address is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
      expect(screen.getByText('Designation / job title is required.')).toBeInTheDocument();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should validate invalid email and invalid username characters', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^username/i), 'admin@invalid!');
      await user.type(screen.getByLabelText(/^work email/i), 'not-an-email');

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      expect(
        screen.getByText(
          /username can only contain letters, numbers, hyphens \(-\), and underscores \(_\)/i,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('should validate password mismatch', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Enter strong password'), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'MismatchPass123!');

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('should clear validation errors when user types in an invalid field', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));
      expect(screen.getByText('First name is required.')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/^first name/i), 'Alex');
      expect(screen.queryByText('First name is required.')).not.toBeInTheDocument();
    });
  });

  // 5. Successful Registration & API Integration
  describe('Successful Registration Flow', () => {
    it('should submit valid payload, prevent forbidden field leakage, and show success screen', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterAdminSuccessResponse,
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^first name/i), 'Alex');
      await user.type(screen.getByLabelText(/^last name/i), 'Mercer');
      await user.type(screen.getByLabelText(/^username/i), 'admin_user');
      await user.type(screen.getByLabelText(/^work email/i), 'admin.user@tobetake.dev');
      await user.type(
        screen.getByPlaceholderText('Enter strong password'),
        'ValidAdminPassword123!',
      );
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidAdminPassword123!');
      await user.type(screen.getByLabelText(/^designation/i), 'Platform Lead');

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /admin account created successfully/i }),
        ).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/admin'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: 'Alex',
            lastName: 'Mercer',
            username: 'admin_user',
            email: 'admin.user@tobetake.dev',
            password: 'ValidAdminPassword123!',
            departmentId: 1,
            designation: 'Platform Lead',
          }),
        }),
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[1];
      const parsedBody = JSON.parse(callArgs[1].body);

      expect(parsedBody.confirmPassword).toBeUndefined();
      expect(parsedBody.roleId).toBeUndefined();
      expect(parsedBody.role).toBeUndefined();
      expect(parsedBody.secret).toBeUndefined();

      expect(screen.getByText('admin-uuid-12345')).toBeInTheDocument();
      expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
      expect(screen.getByText('admin_user')).toBeInTheDocument();
      expect(screen.getByText('admin.user@tobetake.dev')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Platform Lead')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /register another admin/i });
      fireEvent.click(resetBtn);

      expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument();
      expect((screen.getByLabelText(/^first name/i) as HTMLInputElement).value).toBe('');
    });
  });

  // 6. Backend Error Handling
  describe('Backend Error Handling', () => {
    it('should display conflict error when username or email is already registered', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          statusCode: 409,
          message: "The username 'existing_admin' is already taken.",
        }),
      });

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^first name/i), 'Alex');
      await user.type(screen.getByLabelText(/^last name/i), 'Mercer');
      await user.type(screen.getByLabelText(/^username/i), 'existing_admin');
      await user.type(screen.getByLabelText(/^work email/i), 'alex@admin.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^designation/i), 'Platform Lead');

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/the username 'existing_admin' is already taken/i),
        ).toBeInTheDocument();
      });
    });

    it('should display friendly error when server network request fails', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartmentsResponse,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterAdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration (ADMN)')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^first name/i), 'Alex');
      await user.type(screen.getByLabelText(/^last name/i), 'Mercer');
      await user.type(screen.getByLabelText(/^username/i), 'alex_admin');
      await user.type(screen.getByLabelText(/^work email/i), 'alex@admin.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^designation/i), 'Platform Lead');

      fireEvent.click(screen.getByRole('button', { name: /create admin account/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
      });
    });
  });
});
