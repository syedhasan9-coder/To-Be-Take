import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

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

describe('HomePage Component (Product Landing)', () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  describe('Brand and Welcome Section', () => {
    it('should render the brand name and tagline', () => {
      expect(screen.getByRole('heading', { level: 1, name: 'To Be Take' })).toBeInTheDocument();
      expect(screen.getByText('Your marketplace platform')).toBeInTheDocument();
    });

    it('should render the welcome message and account selection guidance', () => {
      expect(
        screen.getByText(/welcome to to be take\. get started by choosing your account type\./i),
      ).toBeInTheDocument();
    });
  });

  describe('Registration Options', () => {
    it('should render Buyer Registration card with description and link to /register/user', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Buyer Registration' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Create your customer account and start shopping.'),
      ).toBeInTheDocument();

      const buyerLink = screen.getByRole('link', { name: 'Register as Buyer' });
      expect(buyerLink).toBeInTheDocument();
      expect(buyerLink).toHaveAttribute('href', '/register/user');
    });

    it('should render Seller Registration card with description and link to /register/seller', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Seller Registration' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Create your seller account and get started.')).toBeInTheDocument();

      const sellerLink = screen.getByRole('link', { name: 'Register as Seller' });
      expect(sellerLink).toBeInTheDocument();
      expect(sellerLink).toHaveAttribute('href', '/register/seller');
    });

    it('should render Admin Registration card with description and link to /register/admin', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Admin Registration' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Create an administrator account.')).toBeInTheDocument();

      const adminLink = screen.getByRole('link', { name: 'Register as Admin' });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute('href', '/register/admin');
    });
  });

  describe('Exclusion of Developer / Internal Status Content', () => {
    it('should not contain technical monorepo package names or developer checklists', () => {
      expect(screen.queryByText('apps/api')).not.toBeInTheDocument();
      expect(screen.queryByText('apps/mobile')).not.toBeInTheDocument();
      expect(screen.queryByText('packages/database')).not.toBeInTheDocument();
      expect(screen.queryByText(/sprint 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/task 5/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/POST \/api/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/GET \/api/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bcrypt/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nestjs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/prisma/i)).not.toBeInTheDocument();
    });
  });
});
