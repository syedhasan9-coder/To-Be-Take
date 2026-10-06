import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CustomerDetailPage from './page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'cust-1' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin/users/customers/cust-1',
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

describe('CustomerDetailPage (/admin/users/customers/[id])', () => {
  const mockCustomerCommerceDetail = {
    id: 'cust-1',
    username: 'fatima_khan',
    email: 'fatima@example.pk',
    firstName: 'Fatima',
    lastName: 'Khan',
    roleId: 4,
    role: 'Customer',
    roleCode: 'CUSTOMER',
    departmentId: null,
    department: null,
    designation: null,
    storeName: null,
    businessCategory: null,
    status: 'ACTIVE',
    isEmailVerified: true,
    isMobileVerified: false,
    isLocked: false,
    lastLogin: new Date('2026-03-01').toISOString(),
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-03-01').toISOString(),
    commerceSummary: {
      totalOrders: 3,
      totalSpent: 450.5,
      averageOrderValue: 150.17,
      lastOrderDate: new Date('2026-03-01').toISOString(),
    },
    orders: [
      {
        id: 'ord-101',
        orderNumber: 'ORD-10021',
        customerId: 'cust-1',
        customerName: 'Fatima Khan',
        customerEmail: 'fatima@example.pk',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        itemCount: 2,
        total: 150.0,
        currency: 'PKR',
        createdAt: new Date('2026-03-01').toISOString(),
        updatedAt: new Date('2026-03-01').toISOString(),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockCustomerCommerceDetail }),
      }),
    );
  });

  it('should render customer identity, commerce KPIs, and recent order history', async () => {
    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Customer 360 Profile/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Fatima/);
      expect(screen.getAllByText(/fatima_khan/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/fatima@example\.pk/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Lifetime Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/450\.50/)).toBeInTheDocument();
      expect(screen.getByText(/150\.17/)).toBeInTheDocument();
      expect(screen.getByText(/ORD-10021/)).toBeInTheDocument();
    });
  });

  it('should allow opening status update modal and submitting status change', async () => {
    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Suspend Account/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Suspend Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Update Status/i)).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/Reason for suspension or activation/i);
    fireEvent.change(reasonInput, { target: { value: 'Suspicious transactions' } });

    const saveBtn = screen.getByRole('button', { name: /Confirm SUSPENDED/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/cust-1/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: 'SUSPENDED',
            reason: 'Suspicious transactions',
          }),
        }),
      );
    });
  });
});
