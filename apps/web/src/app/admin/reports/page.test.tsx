import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PlatformReportsPage from './page';

describe('PlatformReportsPage (/admin/reports)', () => {
  const mockReportsData = {
    growth: [
      { date: 'May 2026', customers: 10, sellers: 2, admins: 1 },
      { date: 'Jun 2026', customers: 20, sellers: 5, admins: 2 },
    ],
    userDistribution: {
      customers: 20,
      sellers: 5,
      admins: 2,
      superAdmins: 1,
      total: 28,
    },
    sellerApprovals: {
      approved: 5,
      pending: 2,
      rejected: 1,
      suspended: 0,
      total: 8,
    },
    activeVsInactive: {
      active: 25,
      inactive: 1,
      suspended: 1,
      pendingVerification: 1,
    },
    registrationsByCategory: [
      { category: 'Electronics & Gadgets', count: 3 },
      { category: 'Beauty & Wellness', count: 2 },
    ],
    recentAdminActivities: [],
    summary: {
      totalAccounts: 28,
      verifiedEmailRate: 89,
      averageLoginsPerDay: 12,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockReportsData }),
      }),
    );
  });

  it('should render platform reports metrics, KPI summaries, and export button', async () => {
    render(<PlatformReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Platform Performance & Growth Reports')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Print Summary/i })).toBeInTheDocument();
      expect(screen.getByText('Verified Email Rate')).toBeInTheDocument();
      expect(screen.getAllByText('89%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Electronics & Gadgets')).toBeInTheDocument();
    });
  });
});
