import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterUserPage from './page';

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

const mockRegisterUserSuccessResponse = {
  success: true,
  message: 'User registered successfully',
  data: {
    id: 'buyer-uuid-12345',
    username: 'bruce_wayne',
    email: 'bruce.wayne@tobetake.dev',
    firstName: 'Bruce',
    lastName: 'Wayne',
    role: 'Buyer',
    roleCode: 'CUST',
    departmentId: null,
    department: null,
    designation: null,
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('RegisterUserPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // 1. Rendering Tests
  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, and all form controls', () => {
      render(<RegisterUserPage />);

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      expect(
        screen.getByText(/join the marketplace and start discovering products/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to to be take/i })).toHaveAttribute(
        'href',
        '/',
      );

      // Section headings
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Account Information')).toBeInTheDocument();

      // Form inputs
      expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should allow typing in all form fields', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      const firstNameInput = screen.getByLabelText(/^first name/i);
      const lastNameInput = screen.getByLabelText(/^last name/i);
      const usernameInput = screen.getByLabelText(/^username/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const passwordInput = screen.getByPlaceholderText('Enter strong password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');

      await user.type(firstNameInput, 'Bruce');
      await user.type(lastNameInput, 'Wayne');
      await user.type(usernameInput, 'bruce_wayne');
      await user.type(emailInput, 'bruce@wayne.com');
      await user.type(passwordInput, 'Batman2026!');
      await user.type(confirmPasswordInput, 'Batman2026!');

      expect(firstNameInput).toHaveValue('Bruce');
      expect(lastNameInput).toHaveValue('Wayne');
      expect(usernameInput).toHaveValue('bruce_wayne');
      expect(emailInput).toHaveValue('bruce@wayne.com');
      expect(passwordInput).toHaveValue('Batman2026!');
      expect(confirmPasswordInput).toHaveValue('Batman2026!');
    });
  });

  // 2. Password Show/Hide Toggle Tests
  describe('Password Visibility Controls', () => {
    it('should toggle password visibility between password and text', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      const passwordInput = screen.getByPlaceholderText('Enter strong password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: 'Show password' });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility between password and text', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: 'Show confirm password' });
      await user.click(toggleButton);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide confirm password' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Hide confirm password' }));
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  // 3. Password Strength Meter & Checklist Tests
  describe('Password Strength Feedback', () => {
    it('should dynamically update checklist items as user types a strong password', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      const passwordInput = screen.getByPlaceholderText('Enter strong password');

      // Type lowercase
      await user.type(passwordInput, 'abc');
      expect(screen.getByText('1 lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();

      // Add uppercase
      await user.type(passwordInput, 'DEF');
      expect(screen.getByText('1 uppercase letter')).toBeInTheDocument();

      // Add digits & symbol
      await user.type(passwordInput, '123!');
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('1 number')).toBeInTheDocument();
      expect(screen.getByText('1 special symbol')).toBeInTheDocument();
    });
  });

  // 4. Client-Side Validation Tests
  describe('Client-Side Validation', () => {
    it('should display required errors when submitting an empty form', () => {
      render(<RegisterUserPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('First name is required.')).toBeInTheDocument();
      expect(screen.getByText('Last name is required.')).toBeInTheDocument();
      expect(screen.getByText('Username is required.')).toBeInTheDocument();
      expect(screen.getByText('Email address is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject first name and last name shorter than 2 characters', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'A');
      await user.type(screen.getByLabelText(/^last name/i), 'B');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByText('First name must be at least 2 characters long.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters long.')).toBeInTheDocument();
    });

    it('should reject invalid username format and bounds', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^username/i), 'ab');
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Username must be at least 3 characters long.')).toBeInTheDocument();

      await user.clear(screen.getByLabelText(/^username/i));
      await user.type(screen.getByLabelText(/^username/i), 'user@invalid!');
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByText(
          'Username can only contain letters, numbers, hyphens (-), and underscores (_).',
        ),
      ).toBeInTheDocument();
    });

    it('should reject invalid email format', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^email address/i), 'not-an-email');
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByText('Please enter a valid email address (e.g. user@example.com).'),
      ).toBeInTheDocument();
    });

    it('should reject weak password not satisfying complexity', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      await user.type(screen.getByPlaceholderText('Enter strong password'), 'weakpass');
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByText(
          'Password must satisfy all security requirements listed in the checklist below.',
        ),
      ).toBeInTheDocument();
    });

    it('should reject mismatched passwords', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'DifferentPassword123!');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('should clear validation errors when user types in an invalid field', async () => {
      const user = userEvent.setup();
      render(<RegisterUserPage />);

      // Trigger validation errors
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText('First name is required.')).toBeInTheDocument();

      // Type in first name
      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      expect(screen.queryByText('First name is required.')).not.toBeInTheDocument();
    });
  });

  // 5. Successful Registration & API Integration
  describe('Successful Registration Flow', () => {
    it('should submit valid payload, prevent role/internal field leakage, and show success screen', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterUserSuccessResponse,
      });

      render(<RegisterUserPage />);

      // Fill in valid buyer data
      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      await user.type(screen.getByLabelText(/^last name/i), 'Wayne');
      await user.type(screen.getByLabelText(/^username/i), 'Bruce_Wayne');
      await user.type(screen.getByLabelText(/^email address/i), 'Bruce.Wayne@tobetake.dev');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /account created successfully/i }),
        ).toBeInTheDocument();
      });

      // Verify the API call arguments
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/user'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: 'Bruce',
            lastName: 'Wayne',
            username: 'bruce_wayne',
            email: 'bruce.wayne@tobetake.dev',
            password: 'ValidPassword123!',
            confirmPassword: 'ValidPassword123!',
          }),
        }),
      );

      // Verify parsed body does NOT contain forbidden fields
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const parsedBody = JSON.parse(callArgs[1].body);

      expect(parsedBody.roleId).toBeUndefined();
      expect(parsedBody.role).toBeUndefined();
      expect(parsedBody.status).toBeUndefined();
      expect(parsedBody.departmentId).toBeUndefined();
      expect(parsedBody.designation).toBeUndefined();
      expect(parsedBody.secret).toBeUndefined();

      // Verify sanitized details displayed on success screen
      expect(screen.getByText('buyer-uuid-12345')).toBeInTheDocument();
      expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
      expect(screen.getByText('bruce_wayne')).toBeInTheDocument();
      expect(screen.getByText('bruce.wayne@tobetake.dev')).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Verify password and hash are NEVER displayed on screen
      expect(screen.queryByText('ValidPassword123!')).not.toBeInTheDocument();
      expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
    });

    it('should allow resetting the form from the success screen', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterUserSuccessResponse,
      });

      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      await user.type(screen.getByLabelText(/^last name/i), 'Wayne');
      await user.type(screen.getByLabelText(/^username/i), 'bruce_wayne');
      await user.type(screen.getByLabelText(/^email address/i), 'bruce@wayne.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /register another account/i }),
        ).toBeInTheDocument();
      });

      // Click reset button
      fireEvent.click(screen.getByRole('button', { name: /register another account/i }));

      // Form is displayed again
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^first name/i)).toHaveValue('');
    });
  });

  // 6. Error Handling & Edge Cases
  describe('API Error Handling', () => {
    it('should display duplicate account conflict error (409)', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: 'The username or email is already registered.',
        }),
      });

      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      await user.type(screen.getByLabelText(/^last name/i), 'Wayne');
      await user.type(screen.getByLabelText(/^username/i), 'existing_user');
      await user.type(screen.getByLabelText(/^email address/i), 'existing@tobetake.dev');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText('The username or email is already registered.'),
        ).toBeInTheDocument();
      });
    });

    it('should display array of backend validation errors (400)', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: ['Username is too short', 'Email must be valid'],
        }),
      });

      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      await user.type(screen.getByLabelText(/^last name/i), 'Wayne');
      await user.type(screen.getByLabelText(/^username/i), 'bruce_wayne');
      await user.type(screen.getByLabelText(/^email address/i), 'bruce@wayne.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Username is too short Email must be valid')).toBeInTheDocument();
      });
    });

    it('should display friendly error when network fails', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterUserPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Bruce');
      await user.type(screen.getByLabelText(/^last name/i), 'Wayne');
      await user.type(screen.getByLabelText(/^username/i), 'bruce_wayne');
      await user.type(screen.getByLabelText(/^email address/i), 'bruce@wayne.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
      });
    });
  });
});
