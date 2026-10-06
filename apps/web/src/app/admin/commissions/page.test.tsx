import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminCommissionsPage from './page';

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

describe('AdminCommissionsPage Component (/admin/commissions)', () => {
  const mockCommissionsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'comm-1',
          orderId: 'order-1',
          orderNumber: 'ORD-2026-0001',
          sellerName: 'Tariq Mehmood',
          storeName: 'Al-Madina Electronics & Gadgets',
          orderAmount: 100.0,
          ratePercent: 10,
          platformAmount: 10.0,
          sellerAmount: 90.0,
          isPaidToSeller: false,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  const mockConfigResponse = {
    success: true,
    data: {
      defaultRatePercent: 10,
      defaultFixedFee: 0,
      categoryOverrides: {},
      sellerOverrides: {},
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConfigResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCommissionsResponse),
      });
    });
  });

  it('should render commission ledger and take-rate KPI cards', async () => {
    render(<AdminCommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Commission Rates & Revenue Splits')).toBeInTheDocument();
      expect(screen.getAllByText('10%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+Rs 10.00')).toBeInTheDocument();
      expect(screen.getByText('Rs 90.00')).toBeInTheDocument();
    });
  });

  it('should open commission configuration modal', async () => {
    render(<AdminCommissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('⚙️ Configure Commission Rates')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⚙️ Configure Commission Rates'));

    expect(screen.getByText('Marketplace Platform Commission Settings')).toBeInTheDocument();
  });
});
