import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterSellerPage from './page';
import { SELLER_BUSINESS_CATEGORIES } from '@tobetake/shared-types';

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

const mockRegisterSellerSuccessResponse = {
  success: true,
  message: 'Seller registered successfully',
  data: {
    id: 'seller-uuid-12345',
    username: 'store_owner',
    email: 'store.owner@tobetake.dev',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'Seller',
    roleCode: 'VENDOR',
    storeName: 'Jane Fashion Boutique',
    businessCategory: 'Fashion & Apparel',
    status: 'ACTIVE',
    isEmailVerified: false,
    isMobileVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
};

describe('RegisterSellerPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // 1. Rendering Tests
  describe('Rendering & Layout', () => {
    it('should render page title, subtitle, back link, and all seller form controls', () => {
      render(<RegisterSellerPage />);

      expect(
        screen.getByRole('heading', { name: /create your seller account/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/create your seller account and get started with to be take/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to to be take/i })).toHaveAttribute(
        'href',
        '/',
      );

      // Section headings
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Business Information')).toBeInTheDocument();

      // Form inputs
      expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
      expect(screen.getByLabelText(/^store name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^business category/i)).toBeInTheDocument();

      // Ensure Admin fields are NOT present
      expect(screen.queryByLabelText(/^department/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^designation/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/administrative information/i)).not.toBeInTheDocument();

      // Actions
      expect(screen.getByRole('button', { name: /create seller account/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/');
    });

    it('should render all marketplace business category options in the dropdown', () => {
      render(<RegisterSellerPage />);

      const categorySelect = screen.getByLabelText(/^business category/i) as HTMLSelectElement;
      expect(categorySelect).toBeInTheDocument();

      // Verify each business category option exists
      SELLER_BUSINESS_CATEGORIES.forEach((category) => {
        expect(screen.getByRole('option', { name: category })).toBeInTheDocument();
      });
    });

    it('should not contain technical sprint or developer tracking badges', () => {
      render(<RegisterSellerPage />);

      expect(screen.queryByText(/sprint/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/task \d/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/apps\/api/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/POST \/api/i)).not.toBeInTheDocument();
    });
  });

  // 2. Password Visibility and Strength Feedback
  describe('Password UX & Show/Hide Controls', () => {
    it('should toggle password visibility when clicking Show/Hide buttons', () => {
      render(<RegisterSellerPage />);

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

    it('should display dynamic password strength feedback when typing password', async () => {
      const user = userEvent.setup();
      render(<RegisterSellerPage />);

      const passwordInput = screen.getByPlaceholderText('Enter strong password');

      // Initially checklist is not displayed
      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();

      // Type a partial password
      await user.type(passwordInput, 'Ab1');
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      expect(screen.getByText(/1 uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/1 lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/1 number/i)).toBeInTheDocument();

      // Type a strong password satisfying all criteria
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!');

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  // 3. Client-side Form Validation Tests
  describe('Form Validation', () => {
    it('should show required validation errors when submitting an empty form', () => {
      render(<RegisterSellerPage />);

      const submitBtn = screen.getByRole('button', { name: /create seller account/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('First name is required.')).toBeInTheDocument();
      expect(screen.getByText('Last name is required.')).toBeInTheDocument();
      expect(screen.getByText('Username is required.')).toBeInTheDocument();
      expect(screen.getByText('Email address is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
      expect(screen.getByText('Store name is required.')).toBeInTheDocument();
      expect(screen.getByText('Please select a business category.')).toBeInTheDocument();

      // Should not ask for admin fields
      expect(screen.queryByText(/designation/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/department/i)).not.toBeInTheDocument();

      expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('should validate invalid email and invalid username characters', async () => {
      const user = userEvent.setup();
      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^username/i), 'user@invalid!');
      await user.type(screen.getByLabelText(/^email address/i), 'not-an-email');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      expect(
        screen.getByText(
          /username can only contain letters, numbers, hyphens \(-\), and underscores \(_\)/i,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('should validate password mismatch', async () => {
      const user = userEvent.setup();
      render(<RegisterSellerPage />);

      await user.type(screen.getByPlaceholderText('Enter strong password'), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'MismatchPass123!');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('should validate minimum character lengths for name and store name fields', async () => {
      const user = userEvent.setup();
      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'J');
      await user.type(screen.getByLabelText(/^last name/i), 'D');
      await user.type(screen.getByLabelText(/^username/i), 'ab');
      await user.type(screen.getByLabelText(/^store name/i), 'S');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      expect(
        screen.getByText('First name must be at least 2 characters long.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters long.')).toBeInTheDocument();
      expect(screen.getByText('Username must be at least 3 characters long.')).toBeInTheDocument();
      expect(
        screen.getByText('Store name must be at least 2 characters long.'),
      ).toBeInTheDocument();
    });

    it('should clear validation errors when user types in an invalid field', async () => {
      const user = userEvent.setup();
      render(<RegisterSellerPage />);

      // Trigger validation errors
      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));
      expect(screen.getByText('First name is required.')).toBeInTheDocument();

      // Type in first name
      await user.type(screen.getByLabelText(/^first name/i), 'Jane');

      expect(screen.queryByText('First name is required.')).not.toBeInTheDocument();
    });
  });

  // 4. Successful Registration & API Integration
  describe('Successful Registration Flow', () => {
    it('should submit valid payload with storeName and businessCategory, prevent forbidden fields, and show success screen', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterSellerSuccessResponse,
      });

      render(<RegisterSellerPage />);

      // Fill in valid seller data
      await user.type(screen.getByLabelText(/^first name/i), 'Jane');
      await user.type(screen.getByLabelText(/^last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^username/i), 'Store_Owner');
      await user.type(screen.getByLabelText(/^email address/i), 'Store.Owner@tobetake.dev');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^store name/i), 'Jane Fashion Boutique');
      await user.selectOptions(screen.getByLabelText(/^business category/i), 'Fashion & Apparel');

      const submitButton = screen.getByRole('button', { name: /create seller account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /seller account created successfully/i }),
        ).toBeInTheDocument();
      });

      // Verify the API call arguments
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/seller'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: 'Jane',
            lastName: 'Doe',
            username: 'store_owner',
            email: 'store.owner@tobetake.dev',
            password: 'ValidPassword123!',
            storeName: 'Jane Fashion Boutique',
            businessCategory: 'Fashion & Apparel',
          }),
        }),
      );

      // Verify parsed body contains storeName & businessCategory and NOT department/designation
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const parsedBody = JSON.parse(callArgs[1].body);

      expect(parsedBody.storeName).toBe('Jane Fashion Boutique');
      expect(parsedBody.businessCategory).toBe('Fashion & Apparel');
      expect(parsedBody.departmentId).toBeUndefined();
      expect(parsedBody.designation).toBeUndefined();
      expect(parsedBody.confirmPassword).toBeUndefined();
      expect(parsedBody.roleId).toBeUndefined();
      expect(parsedBody.role).toBeUndefined();
      expect(parsedBody.secret).toBeUndefined();
      expect(parsedBody.registrationSecret).toBeUndefined();

      // Verify sanitized details displayed on success screen
      expect(screen.getByText('seller-uuid-12345')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('store_owner')).toBeInTheDocument();
      expect(screen.getByText('store.owner@tobetake.dev')).toBeInTheDocument();
      expect(screen.getByText('Seller')).toBeInTheDocument();
      expect(screen.getByText('Jane Fashion Boutique')).toBeInTheDocument();
      expect(screen.getByText('Fashion & Apparel')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Test "Register Another Seller" reset
      const resetBtn = screen.getByRole('button', { name: /register another seller/i });
      fireEvent.click(resetBtn);

      expect(screen.getByRole('button', { name: /create seller account/i })).toBeInTheDocument();
      expect((screen.getByLabelText(/^first name/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/^store name/i) as HTMLInputElement).value).toBe('');
    });
  });

  // 5. Error Handling
  describe('Backend Error Handling', () => {
    it('should display conflict error when username or email is already registered', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          statusCode: 409,
          message: "The username 'existing_seller' is already taken.",
        }),
      });

      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Jane');
      await user.type(screen.getByLabelText(/^last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^username/i), 'existing_seller');
      await user.type(screen.getByLabelText(/^email address/i), 'jane@store.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^store name/i), 'Existing Store');
      await user.selectOptions(
        screen.getByLabelText(/^business category/i),
        'Electronics & Gadgets',
      );

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/the username 'existing_seller' is already taken/i),
        ).toBeInTheDocument();
      });
    });

    it('should display restricted error when backend returns 403 Forbidden', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          statusCode: 403,
          message: 'Forbidden',
        }),
      });

      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Jane');
      await user.type(screen.getByLabelText(/^last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^username/i), 'jane_seller');
      await user.type(screen.getByLabelText(/^email address/i), 'jane@store.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^store name/i), 'Jane Store');
      await user.selectOptions(screen.getByLabelText(/^business category/i), 'Beauty & Wellness');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/seller registration is currently restricted/i),
        ).toBeInTheDocument();
      });
    });

    it('should display friendly error when server network request fails', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Jane');
      await user.type(screen.getByLabelText(/^last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^username/i), 'jane_seller');
      await user.type(screen.getByLabelText(/^email address/i), 'jane@store.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^store name/i), 'Jane Store');
      await user.selectOptions(screen.getByLabelText(/^business category/i), 'Home & Living');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      await waitFor(() => {
        expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
      });
    });

    it('should display joined message when backend returns 400 with array of validation errors', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          statusCode: 400,
          message: [
            'Username must be at least 3 characters long',
            'Password must be at least 8 characters long',
          ],
          error: 'Bad Request',
        }),
      });

      render(<RegisterSellerPage />);

      await user.type(screen.getByLabelText(/^first name/i), 'Jane');
      await user.type(screen.getByLabelText(/^last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^username/i), 'jane_seller');
      await user.type(screen.getByLabelText(/^email address/i), 'jane@store.com');
      await user.type(screen.getByPlaceholderText('Enter strong password'), 'ValidPassword123!');
      await user.type(screen.getByPlaceholderText('Re-enter password'), 'ValidPassword123!');
      await user.type(screen.getByLabelText(/^store name/i), 'Jane Store');
      await user.selectOptions(screen.getByLabelText(/^business category/i), 'Sports & Outdoors');

      fireEvent.click(screen.getByRole('button', { name: /create seller account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Username must be at least 3 characters long Password must be at least 8 characters long',
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
