import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminOrdersPage from './page';

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

describe('AdminOrdersPage Component (/admin/orders)', () => {
  const mockOrdersResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'order-1',
          orderNumber: 'ORD-2026-0001',
          customerName: 'Fatima Khan',
          customerEmail: 'fatima@example.pk',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 189.5,
          currency: 'PKR',
          itemsCount: 2,
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
        json: () => Promise.resolve(mockOrdersResponse),
      }),
    );
  });

  it('should render orders table and search form', async () => {
    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Marketplace Orders')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Fatima Khan')).toBeInTheDocument();
      expect(screen.getByText('Rs 189.50')).toBeInTheDocument();
    });
  });

  it('should open cancellation modal and handle cancellation', async () => {
    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Cancel Order #ORD-2026-0001')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e.g. Customer requested cancellation/i),
    ).toBeInTheDocument();
  });
});
