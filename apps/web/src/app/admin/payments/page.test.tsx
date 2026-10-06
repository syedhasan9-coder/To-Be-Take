import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminPaymentsPage from './page';

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

describe('AdminPaymentsPage Component (/admin/payments)', () => {
  const mockPaymentsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'pmt-1',
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          customerName: 'Bilal Ahmed',
          customerEmail: 'bilal@example.pk',
          amount: 150.0,
          currency: 'PKR',
          method: 'JAZZCASH',
          provider: 'JAZZCASH',
          status: 'PAID',
          transactionId: 'JC-PK-99201948',
          providerRef: 'pi_test_123',
          settledAt: new Date().toISOString(),
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
        json: () => Promise.resolve(mockPaymentsResponse),
      }),
    );
  });

  it('should render payments list with reference ID, order number, and status', async () => {
    render(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Payments & Transactions')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('JC-PK-99201948')).toBeInTheDocument();
      expect(screen.getByText('Rs 150.00')).toBeInTheDocument();
    });
  });

  it('should open refund modal for paid transactions', async () => {
    render(<AdminPaymentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Refund')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refund'));

    expect(screen.getByText(/Process Payment Refund/i)).toBeInTheDocument();
    expect(screen.getByText('Confirm Refund')).toBeInTheDocument();
  });
});
