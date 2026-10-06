import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SellerDetailPage from './page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'vend-1' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin/users/sellers/vend-1',
}));

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

describe('SellerDetailPage (/admin/users/sellers/[id])', () => {
  const mockSellerCommerceDetail = {
    id: 'vend-1',
    username: 'gulberg_botanicals',
    email: 'contact@gulbergbotanicals.pk',
    firstName: 'Sana',
    lastName: 'Mirza',
    storeName: 'Gulberg Botanicals & Scents',
    businessCategory: 'Botanicals & Scents',
    roleId: 3,
    role: 'Vendor',
    roleCode: 'VENDOR',
    departmentId: null,
    department: null,
    designation: null,
    status: 'ACTIVE',
    isEmailVerified: true,
    isMobileVerified: true,
    isLocked: false,
    lastLogin: new Date('2026-03-01').toISOString(),
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-03-01').toISOString(),
    commerceSummary: {
      totalProducts: 12,
      totalOrders: 45,
      totalRevenue: 3450.0,
      platformCommissionPaid: 345.0,
      totalPayouts: 2800.0,
      pendingBalance: 305.0,
    },
    products: [
      {
        id: 'prod-101',
        name: 'Monstera Deliciosa Plant',
        sku: 'PLANT-MON-01',
        price: 34.5,
        isActive: true,
        categoryName: 'Indoor Plants',
        stockQuantity: 25,
        totalSales: 80,
      },
    ],
    recentOrders: [
      {
        id: 'ord-101',
        orderNumber: 'ORD-10021',
        customerId: 'cust-1',
        customerName: 'Fatima Khan',
        customerEmail: 'fatima@example.pk',
        itemCount: 1,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        currency: 'PKR',
        subtotal: 135.0,
        shippingTotal: 10.0,
        taxTotal: 5.0,
        discountTotal: 0,
        total: 150.0,
        createdAt: new Date('2026-03-01').toISOString(),
        updatedAt: new Date('2026-03-01').toISOString(),
      },
    ],
    recentPayouts: [
      {
        id: 'pay-1',
        payoutNumber: 'PO-2026-001',
        sellerId: 'vend-1',
        sellerName: 'Sana Mirza',
        storeName: 'Gulberg Botanicals & Scents',
        amount: 500.0,
        currency: 'PKR',
        status: 'PAID',
        periodStart: new Date('2026-02-01').toISOString(),
        periodEnd: new Date('2026-02-28').toISOString(),
        processedAt: new Date('2026-02-28').toISOString(),
        processedByName: 'Admin',
        notes: 'Monthly payout',
        commissionsCount: 1,
        createdAt: new Date('2026-02-27').toISOString(),
        updatedAt: new Date('2026-02-28').toISOString(),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSellerCommerceDetail }),
      }),
    );
  });

  it('should render seller business identity, commerce KPIs, and catalog products', async () => {
    render(<SellerDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Gulberg Botanicals & Scents/);
      expect(screen.getAllByText(/contact@gulbergbotanicals\.pk/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Seller \/ Vendor 360 Profile/)).toBeInTheDocument();
      expect(screen.getAllByText(/3,450\.00/)[0]).toBeInTheDocument(); // Gross Sales
      expect(screen.getAllByText(/345\.00/)[0]).toBeInTheDocument(); // Commission
      expect(screen.getAllByText(/305\.00/)[0]).toBeInTheDocument(); // Pending Balance
    });
  });

  it('should allow switching between tabs (Catalog Products, Order Items, Payouts)', async () => {
    render(<SellerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Catalog Products (1)')).toBeInTheDocument();
    });

    // Switch to Products tab
    fireEvent.click(screen.getByText('Catalog Products (1)'));
    expect(screen.getByText('Monstera Deliciosa Plant')).toBeInTheDocument();
    expect(screen.getByText('PLANT-MON-01')).toBeInTheDocument();

    // Switch to Payouts tab
    fireEvent.click(screen.getByText('Payout Disbursements (1)'));
    expect(screen.getByText('PO-2026-001')).toBeInTheDocument();
  });
});
