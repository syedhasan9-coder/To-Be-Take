import React from 'react';
import { render, screen } from '@testing-library/react';
import PublicLayout from './layout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock customer API
jest.mock('../../lib/customer-api', () => ({
  customerApi: {
    getCategories: jest.fn().mockResolvedValue([]),
    getCart: jest.fn().mockResolvedValue({ items: [], totalItems: 0, subtotal: 0 }),
    getWishlist: jest.fn().mockResolvedValue([]),
    getNotifications: jest.fn().mockResolvedValue({ notifications: [], unreadCount: 0 }),
  },
  getCustomerAuthToken: jest.fn().mockReturnValue(null),
  getCustomerStoredUser: jest.fn().mockReturnValue(null),
  setCustomerAuthToken: jest.fn(),
  setCustomerStoredUser: jest.fn(),
  removeCustomerAuthToken: jest.fn(),
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

describe('PublicLayout Component ((public) Storefront Shell)', () => {
  it('should render customer storefront shell with CustomerHeader, CustomerFooter, and CustomerBottomNav', () => {
    const { container } = render(
      <PublicLayout>
        <div data-testid="test-public-child">Storefront Home Content</div>
      </PublicLayout>,
    );

    expect(screen.getByTestId('test-public-child')).toBeInTheDocument();

    // Verify CustomerHeader is mounted
    expect(container.querySelector('.customer-main-header')).toBeInTheDocument();

    // Verify CustomerFooter is mounted
    expect(container.querySelector('.customer-main-footer')).toBeInTheDocument();

    // Verify CustomerBottomNav is mounted
    expect(container.querySelector('.customer-bottom-nav')).toBeInTheDocument();

    // Verify public-marketplace-shell wrapper is present
    expect(container.querySelector('.public-marketplace-shell')).toBeInTheDocument();
  });
});
