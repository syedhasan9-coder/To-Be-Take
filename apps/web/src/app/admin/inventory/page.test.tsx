import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminInventoryPage from './page';

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

describe('AdminInventoryPage Component (/admin/inventory)', () => {
  const mockInventoryResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'inv-1',
          productId: 'prod-1',
          productTitle: 'Organic Green Tea',
          sku: 'TEA-001',
          currentStock: 45,
          reservedStock: 5,
          availableStock: 40,
          lowStockThreshold: 10,
          status: 'IN_STOCK',
          storeName: 'Herbal Haven',
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
        json: () => Promise.resolve(mockInventoryResponse),
      }),
    );
  });

  it('should render inventory stock table with SKU, reserved stock and available units', async () => {
    render(<AdminInventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(screen.getByText('Organic Green Tea')).toBeInTheDocument();
      expect(screen.getByText('SKU: TEA-001')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
    });
  });

  it('should open stock adjustment modal and submit PATCH /api/admin/inventory/:id/stock', async () => {
    render(<AdminInventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Adjust Stock')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Adjust Stock'));

    expect(screen.getByText(/Stock Adjustment: Organic Green Tea/i)).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    const changeTypeSelect = selects[selects.length - 1];
    fireEvent.change(changeTypeSelect, { target: { value: 'RESTOCK' } });

    const numberInputs = screen.getAllByRole('spinbutton');
    const quantityInput = numberInputs[numberInputs.length - 1];
    fireEvent.change(quantityInput, { target: { value: '10' } });

    const submitBtn = screen.getByRole('button', { name: /Apply Stock Change/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/inventory/inv-1/stock'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            stockQuantity: 55, // 45 currentStock + 10 restock
            changeType: 'RESTOCK',
            reason: 'RESTOCK',
          }),
        }),
      );
    });
  });
});
