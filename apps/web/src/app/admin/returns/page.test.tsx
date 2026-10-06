import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminReturnsPage from './page';

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

describe('AdminReturnsPage Component (/admin/returns)', () => {
  const mockReturnsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'ret-1',
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          customerName: 'Carol Customer',
          customerEmail: 'carol@example.com',
          storeName: 'Linen & Silk',
          reason: 'Item arrived damaged in transport',
          status: 'REQUESTED',
          refundAmount: 75.0,
          adminNotes: null,
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
        json: () => Promise.resolve(mockReturnsResponse),
      }),
    );
  });

  it('should render return requests with order number and return reason', async () => {
    render(<AdminReturnsPage />);

    await waitFor(() => {
      expect(screen.getByText('Returns & Refund Management')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Item arrived damaged in transport')).toBeInTheDocument();
      expect(screen.getByText('Rs 75.00')).toBeInTheDocument();
    });
  });

  it('should open return review modal and allow approval/rejection', async () => {
    render(<AdminReturnsPage />);

    await waitFor(() => {
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Review'));

    expect(screen.getByText(/Review Return: Order #ORD-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByText('Decision Status')).toBeInTheDocument();
  });
});
