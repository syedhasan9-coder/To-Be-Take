import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SellerProductsPage from './page';

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

describe('SellerProductsPage Component (/seller/products)', () => {
  const mockProductsResponse = {
    items: [
      {
        id: 'prod-1',
        name: 'Premium Raw Honey',
        sku: 'HNY-001',
        price: 19.99,
        stockQuantity: 45,
        status: 'ACTIVE',
        categoryName: 'Organic Foods',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        name: 'Artisan Soap Bar',
        sku: 'SOP-002',
        price: 8.5,
        stockQuantity: 5,
        status: 'DRAFT',
        categoryName: 'Personal Care',
        createdAt: new Date().toISOString(),
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem(
      'tobetake_auth_user',
      JSON.stringify({ id: 'vendor-123', email: 'vendor@tobetake.com', role: 'VENDOR' })
    );

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })
    );
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders products list for the authenticated seller', async () => {
    render(<SellerProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Store Catalog & Products')).toBeInTheDocument();
      expect(screen.getByText('Premium Raw Honey')).toBeInTheDocument();
      expect(screen.getByText('SKU: HNY-001')).toBeInTheDocument();
      expect(screen.getByText('Artisan Soap Bar')).toBeInTheDocument();
    });
  });

  it('allows searching and filtering products', async () => {
    render(<SellerProductsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by product name or SKU...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by product name or SKU...');
    fireEvent.change(searchInput, { target: { value: 'Honey' } });

    expect(searchInput).toHaveValue('Honey');
  });
});
