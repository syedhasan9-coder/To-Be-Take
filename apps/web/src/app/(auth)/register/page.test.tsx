import React from 'react';
import { render, screen } from '@testing-library/react';
import RegisterSelectionPage from './page';

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

describe('RegisterSelectionPage Component (/register)', () => {
  beforeEach(() => {
    render(<RegisterSelectionPage />);
  });

  describe('Header and Navigation', () => {
    it('should render back navigation link to home', () => {
      const backLink = screen.getByRole('link', { name: '← Back to Home' });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should render page title and subtitle', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Create Your Account' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Select the account type that matches your role to begin your registration.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Role Selection Options', () => {
    it('should render Buyer Account card with link to /register/user', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Buyer / Customer' }),
      ).toBeInTheDocument();
      const buyerLink = screen.getByRole('link', { name: 'Create Buyer Account →' });
      expect(buyerLink).toBeInTheDocument();
      expect(buyerLink).toHaveAttribute('href', '/register/user');

      const signInLinks = screen.getAllByRole('link', { name: 'Sign In' });
      expect(signInLinks[0]).toBeInTheDocument();
      expect(signInLinks[0]).toHaveAttribute('href', '/login/user');
    });

    it('should render Seller Account card with link to /register/seller', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Seller / Vendor' }),
      ).toBeInTheDocument();
      const sellerLink = screen.getByRole('link', { name: 'Create Seller Account →' });
      expect(sellerLink).toBeInTheDocument();
      expect(sellerLink).toHaveAttribute('href', '/register/seller');

      const signInLinks = screen.getAllByRole('link', { name: 'Sign In' });
      expect(signInLinks[1]).toBeInTheDocument();
      expect(signInLinks[1]).toHaveAttribute('href', '/login/seller');
    });

    it('should render Admin Account card with link to /register/admin', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Admin / Super Admin' }),
      ).toBeInTheDocument();
      const adminLink = screen.getByRole('link', { name: 'Create Admin Account →' });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute('href', '/register/admin');

      const signInLinks = screen.getAllByRole('link', { name: 'Sign In' });
      expect(signInLinks[2]).toBeInTheDocument();
      expect(signInLinks[2]).toHaveAttribute('href', '/login/admin');
    });
  });

  describe('Sign In Helper Navigation', () => {
    it('should render a link to sign in for existing users', () => {
      const signInLink = screen.getByRole('link', { name: 'Sign In to Your Account →' });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });
});
