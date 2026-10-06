import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CustomersManagementPage from './page';

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

describe('CustomersManagementPage (/admin/users/customers)', () => {
  const mockCustomersData = {
    items: [
      {
        id: 'cust-1',
        username: 'bilal_buyer',
        email: 'bilal@tobetake.pk',
        firstName: 'Bilal',
        lastName: 'Ahmed',
        roleId: 4,
        role: 'Buyer',
        roleCode: 'CUST',
        status: 'ACTIVE',
        isEmailVerified: true,
        isMobileVerified: false,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        json: () => Promise.resolve({ success: true, data: mockCustomersData }),
      }),
    );
  });

  it('should render customer management header and table', async () => {
    render(<CustomersManagementPage />);

    expect(screen.getByText('Customer Management')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Bilal Ahmed')).toBeInTheDocument();
      expect(screen.getByText('@bilal_buyer')).toBeInTheDocument();
      expect(screen.getByText('bilal@tobetake.pk')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });
});
