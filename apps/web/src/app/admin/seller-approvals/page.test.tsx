import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SellerApprovalsPage from './page';

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

describe('SellerApprovalsPage (/admin/seller-approvals)', () => {
  const mockApprovalsData = {
    items: [
      {
        id: 'approval-1',
        sellerId: 'seller-1',
        sellerUsername: 'botanica_vendor',
        sellerEmail: 'botanica@tobetake.dev',
        sellerName: 'Elena Green',
        storeName: 'Botanica Herbals',
        businessCategory: 'Beauty & Wellness',
        status: 'PENDING',
        accountStatus: 'PENDING_VERIFICATION',
        notes: null,
        rejectionReason: null,
        submittedAt: new Date().toISOString(),
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
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockApprovalsData }),
      }),
    );
  });

  it('should render seller approvals queue and pending store application', async () => {
    render(<SellerApprovalsPage />);

    expect(screen.getByText('Seller Onboarding & Approvals')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Botanica Herbals')).toBeInTheDocument();
      expect(screen.getByText('Beauty & Wellness')).toBeInTheDocument();
      expect(screen.getByText('Elena Green')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    });
  });
});
