import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SuperAdminDashboardPage from './page';

// Mock Next.js Link component
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

describe('SuperAdminDashboardPage Component (/admin/dashboard)', () => {
  const mockDashboardData = {
    kpis: {
      totalCustomers: 1250,
      totalSellers: 85,
      totalAdmins: 6,
      pendingSellerApprovals: 3,
      activeUsers: 1320,
      suspendedUsers: 21,
    },
    growth: [
      { date: 'Jan 2026', customers: 800, sellers: 40, admins: 4 },
      { date: 'Feb 2026', customers: 1250, sellers: 85, admins: 6 },
    ],
    userDistribution: {
      customers: 1250,
      sellers: 85,
      admins: 6,
      superAdmins: 2,
      total: 1343,
    },
    sellerApprovalStatus: {
      approved: 85,
      pending: 3,
      rejected: 4,
      suspended: 2,
      total: 94,
    },
    recentActivity: [
      {
        id: 'log-1',
        actorName: 'superadmin',
        actorRole: 'SPADMIN',
        action: 'SELLER_APPROVED',
        targetType: 'SellerApproval',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      },
    ],
    recentUsers: [
      {
        id: 'user-1',
        username: 'fatima_customer',
        email: 'fatima@tobetake.pk',
        firstName: 'Fatima',
        lastName: 'Khan',
        roleId: 4,
        role: 'Buyer',
        roleCode: 'CUST',
        status: 'ACTIVE',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    systemOverview: {
      platformStatus: 'ONLINE',
      customerRegistrationEnabled: true,
      sellerRegistrationEnabled: true,
      maintenanceMode: false,
      maintenanceMessage: 'Normal operation',
      databaseStatus: 'connected',
      serverUptime: 3600,
      environment: 'development',
      version: '1.0.0',
    },
    alerts: [
      {
        id: 'alert-pending-sellers',
        level: 'warning',
        title: 'Pending Seller Approvals',
        message: '3 seller onboarding requests require review and approval.',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockDashboardData }),
      }),
    );
  });

  it('should render welcome banner and control center tag', async () => {
    render(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
    });
  });

  it('should render live KPI cards with database metrics', async () => {
    render(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getAllByText('1,250').length).toBeGreaterThan(0);
      expect(screen.getByText('Total Sellers')).toBeInTheDocument();
      expect(screen.getAllByText('85').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pending Seller Approvals').length).toBeGreaterThan(0);
    });
  });

  it('should render system alerts and operational shortcuts', async () => {
    render(<SuperAdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Pending Seller Approvals').length).toBeGreaterThan(0);
      expect(screen.getByText(/Shortcuts|Actions/i)).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });
  });
});
