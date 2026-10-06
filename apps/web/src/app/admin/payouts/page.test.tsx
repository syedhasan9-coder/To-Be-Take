import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminPayoutsPage from './page';

describe('AdminPayoutsPage Component (/admin/payouts)', () => {
  const mockPayoutsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'pay-1',
          sellerId: 'seller-1',
          sellerName: 'Tariq Mehmood',
          storeName: 'Chiniot Sheesham Woodcrafts',
          amount: 450.0,
          currency: 'PKR',
          status: 'PENDING',
          method: 'BANK_TRANSFER',
          reference: null,
          notes: null,
          createdAt: new Date().toISOString(),
          paidAt: null,
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
        json: () => Promise.resolve(mockPayoutsResponse),
      }),
    );
  });

  it('should render payouts ledger with store name and pending amount', async () => {
    render(<AdminPayoutsPage />);

    await waitFor(() => {
      expect(screen.getByText('Seller Payouts & Disbursements')).toBeInTheDocument();
      expect(screen.getByText('Chiniot Sheesham Woodcrafts')).toBeInTheDocument();
      expect(screen.getByText('Rs 450.00')).toBeInTheDocument();
    });
  });

  it('should open payout processing modal with status selection and reference input', async () => {
    render(<AdminPayoutsPage />);

    await waitFor(() => {
      expect(screen.getByText('Process')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Process'));

    expect(screen.getByText(/Process Payout: Chiniot Sheesham Woodcrafts/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. RAAST-992019482/i)).toBeInTheDocument();
  });
});
