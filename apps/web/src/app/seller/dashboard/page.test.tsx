import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SellerDashboardPage from './page';

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

describe('SellerDashboardPage Component (/seller/dashboard)', () => {
  const mockDashboardData = {
    kpis: {
      totalSales: 12500,
      netSales: 10625,
      totalOrders: 42,
      pendingOrders: 5,
      processingOrders: 3,
      shippedOrders: 10,
      deliveredOrders: 20,
      cancelledOrders: 2,
      returnedOrders: 2,
      activeProducts: 15,
      lowStockProducts: 3,
      outOfStockProducts: 1,
      pendingPayout: 1875,
      paidBalance: 8750,
      availableBalance: 1875,
      platformCommission: 1875,
      averageOrderValue: 297.62,
    },
    recentOrders: [
      {
        id: 'ord-101',
        orderNumber: 'ORD-2026-0001',
        customerName: 'Sarah M.',
        createdAt: new Date().toISOString(),
        status: 'DELIVERED',
        sellerSubtotal: 250,
        itemCount: 2,
      },
    ],
    topProducts: [
      {
        id: 'prod-101',
        name: 'Organic Moringa Powder',
        sku: 'MOR-001',
        price: 24.99,
        stockQuantity: 85,
        totalSold: 120,
        status: 'ACTIVE',
      },
    ],
    lowStockAlerts: [
      {
        id: 'inv-1',
        productId: 'prod-102',
        productName: 'Artisan Herbal Tea',
        sku: 'TEA-002',
        stockQuantity: 3,
        lowStockThreshold: 10,
        status: 'LOW_STOCK',
      },
    ],
    recentReviews: [
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Exceptional organic quality!',
        createdAt: new Date().toISOString(),
        user: { name: 'Sarah M.' },
        product: { name: 'Organic Moringa Powder' },
      },
    ],
    recentNotifications: [
      {
        id: 'notif-1',
        title: 'New Order Received',
        message: 'Order ORD-2026-0001 has been placed.',
        type: 'ORDER',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ],
    earningsSummary: {
      grossSales: 12500,
      commissions: 1875,
      refunds: 0,
      netEarnings: 10625,
      availableBalance: 1875,
      paidBalance: 8750,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem(
      'tobetake_auth_user',
      JSON.stringify({ id: 'vendor-123', email: 'vendor@tobetake.com', role: 'VENDOR' })
    );

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    );
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders operational KPIs from real seller data', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Merchant Overview')).toBeInTheDocument();
      expect(screen.getByText('Rs 12,500.00')).toBeInTheDocument();
      expect(screen.getByText('Rs 10,625.00')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('renders recent orders and top products cards', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Organic Moringa Powder')).toBeInTheDocument();
    });
  });

  it('renders low stock alerts when inventory is low', async () => {
    render(<SellerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Artisan Herbal Tea')).toBeInTheDocument();
      expect(screen.getByText('3 in stock')).toBeInTheDocument();
    });
  });
});
