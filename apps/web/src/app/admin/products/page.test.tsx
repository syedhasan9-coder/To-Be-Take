import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminProductsPage from './page';

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

describe('AdminProductsPage Component (/admin/products)', () => {
  const mockProductsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'prod-1',
          title: 'Handcrafted Multan Blue Pottery Vase',
          slug: 'handcrafted-multan-blue-pottery-vase',
          sku: 'POT-MLT-001',
          price: 49.99,
          stockQuantity: 12,
          status: 'PUBLISHED',
          moderationStatus: 'APPROVED',
          sellerName: 'Tariq Mehmood',
          storeName: 'Multan Blue Pottery Crafts',
          categoryName: 'Home & Living',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      }),
    );
  });

  it('should render products list with SKU, price, seller store, and moderation status', async () => {
    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Product Catalog & Moderation')).toBeInTheDocument();
      expect(screen.getByText('Handcrafted Multan Blue Pottery Vase')).toBeInTheDocument();
      expect(screen.getByText('SKU: POT-MLT-001')).toBeInTheDocument();
      expect(screen.getByText('Multan Blue Pottery Crafts')).toBeInTheDocument();
      expect(screen.getByText('Rs 49.99')).toBeInTheDocument();
    });
  });

  it('should open moderation dialog upon clicking Reject/Approve action', async () => {
    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reject'));

    expect(screen.getByText(/Moderate Product: Handcrafted Multan Blue Pottery Vase/i)).toBeInTheDocument();
  });
});
