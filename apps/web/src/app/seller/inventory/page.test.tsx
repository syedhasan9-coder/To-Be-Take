import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SellerInventoryPage from './page';

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

describe('SellerInventoryPage Component (/seller/inventory)', () => {
  const mockInventoryResponse = {
    items: [
      {
        id: 'inv-1',
        productId: 'prod-1',
        productName: 'Herbal Shampoo',
        sku: 'SHM-001',
        stockQuantity: 50,
        reservedQuantity: 0,
        availableQuantity: 50,
        lowStockThreshold: 10,
        status: 'IN_STOCK',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        productId: 'prod-2',
        productName: 'Lavender Oil',
        sku: 'OIL-002',
        stockQuantity: 4,
        reservedQuantity: 0,
        availableQuantity: 4,
        lowStockThreshold: 10,
        status: 'LOW_STOCK',
        updatedAt: new Date().toISOString(),
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
        json: () => Promise.resolve(mockInventoryResponse),
      })
    );
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders inventory items and stock levels', async () => {
    render(<SellerInventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Inventory & Stock Workspace')).toBeInTheDocument();
      expect(screen.getByText('Herbal Shampoo')).toBeInTheDocument();
      expect(screen.getByText('SHM-001')).toBeInTheDocument();
      expect(screen.getByText('Lavender Oil')).toBeInTheDocument();
    });
  });

  it('opens adjust stock modal on click', async () => {
    render(<SellerInventoryPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Adjust Stock').length).toBeGreaterThan(0);
    });

    const adjustBtns = screen.getAllByText('Adjust Stock');
    fireEvent.click(adjustBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Adjust Stock Quantity')).toBeInTheDocument();
      expect(screen.getAllByText('Herbal Shampoo').length).toBeGreaterThan(0);
    });
  });
});
