import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginSelectionPage from './page';

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

describe('LoginSelectionPage Component (/login)', () => {
  beforeEach(() => {
    render(<LoginSelectionPage />);
  });

  describe('Header and Navigation', () => {
    it('should render back navigation link to home', () => {
      const backLink = screen.getByRole('link', { name: '← Back to Home' });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should render page title and subtitle', () => {
      expect(screen.getByRole('heading', { level: 1, name: 'Welcome Back' })).toBeInTheDocument();
      expect(
        screen.getByText('Choose how you want to sign in to access your To Be Take workspace.'),
      ).toBeInTheDocument();
    });
  });

  describe('Sign In Options', () => {
    it('should render active Admin / Super Admin login option with link to /login/admin', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Admin / Super Admin' }),
      ).toBeInTheDocument();
      const adminLoginLink = screen.getByRole('link', { name: 'Sign In as Admin →' });
      expect(adminLoginLink).toBeInTheDocument();
      expect(adminLoginLink).toHaveAttribute('href', '/login/admin');

      const createAdminLink = screen.getByRole('link', { name: 'Create Admin Account' });
      expect(createAdminLink).toBeInTheDocument();
      expect(createAdminLink).toHaveAttribute('href', '/register/admin');
    });

    it('should render active Buyer Sign In option with link to /login/user', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Buyer / Customer' }),
      ).toBeInTheDocument();

      const buyerLoginLink = screen.getByRole('link', { name: 'Sign In as Buyer →' });
      expect(buyerLoginLink).toBeInTheDocument();
      expect(buyerLoginLink).toHaveAttribute('href', '/login/user');

      const createBuyerLink = screen.getByRole('link', { name: 'Create Buyer Account' });
      expect(createBuyerLink).toBeInTheDocument();
      expect(createBuyerLink).toHaveAttribute('href', '/register/user');
    });

    it('should render active Seller Sign In option with link to /login/seller', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Seller / Vendor' }),
      ).toBeInTheDocument();

      const sellerLoginLink = screen.getByRole('link', { name: 'Sign In as Seller →' });
      expect(sellerLoginLink).toBeInTheDocument();
      expect(sellerLoginLink).toHaveAttribute('href', '/login/seller');

      const createSellerLink = screen.getByRole('link', { name: 'Create Seller Account' });
      expect(createSellerLink).toBeInTheDocument();
      expect(createSellerLink).toHaveAttribute('href', '/register/seller');
    });
  });

  describe('Create Account Helper Navigation', () => {
    it('should render a link to create account for new visitors', () => {
      const createAccountLink = screen.getByRole('link', { name: 'Create an Account →' });
      expect(createAccountLink).toBeInTheDocument();
      expect(createAccountLink).toHaveAttribute('href', '/register');
    });
  });
});
