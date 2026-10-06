import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminShippingPage from './page';

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

describe('AdminShippingPage Component (/admin/shipping)', () => {
  const mockShippingResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'ship-1',
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          carrier: 'TCS Express',
          trackingNumber: 'TCS-883920194',
          trackingUrl: 'https://www.tcsexpress.com/track',
          status: 'IN_TRANSIT',
          shippedAt: new Date().toISOString(),
          deliveredAt: null,
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
        json: () => Promise.resolve(mockShippingResponse),
      }),
    );
  });

  it('should render shipping log with carrier and tracking number', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Shipping & Delivery Tracking')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('TCS Express')).toBeInTheDocument();
      expect(screen.getByText('TCS-883920194')).toBeInTheDocument();
    });
  });

  it('should open tracking modal and allow editing carrier tracking details', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update'));

    expect(screen.getByText(/Update Shipment: Order #ORD-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('TCS Express')).toBeInTheDocument();
  });
});
