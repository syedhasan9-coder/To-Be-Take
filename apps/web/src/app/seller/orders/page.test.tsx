import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SellerOrdersPage from './page';

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

describe('SellerOrdersPage Component (/seller/orders)', () => {
  const mockOrdersResponse = {
    items: [
      {
        id: 'ord-1',
        orderNumber: 'ORD-2026-999',
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        customerName: 'Fatima Khan',
        customerEmail: 'fatima@example.pk',
        itemCount: 2,
        total: 50.0,
        createdAt: new Date().toISOString(),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem(
      'tobetake_auth_user',
      JSON.stringify({ id: 'vendor-123', email: 'vendor@tobetake.pk', role: 'VENDOR' })
    );

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrdersResponse),
      })
    );
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders orders containing seller items', async () => {
    render(<SellerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Customer Orders & Fulfillment')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-999')).toBeInTheDocument();
      expect(screen.getByText('Fatima Khan')).toBeInTheDocument();
      expect(screen.getByText('Rs 50.00')).toBeInTheDocument();
      expect(screen.getByText('2 item(s)')).toBeInTheDocument();
    });
  });
});
