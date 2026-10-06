import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SellerRootLayout from './layout';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/seller/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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

describe('SellerRootLayout Component (/seller/* Shell)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render authentication required view when no user session is present', async () => {
    render(
      <SellerRootLayout>
        <div data-testid="test-seller-child">Seller Page Content</div>
      </SellerRootLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Seller Authentication Required')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In as Seller →/i })).toHaveAttribute('href', '/login/seller');
      expect(screen.queryByTestId('test-seller-child')).not.toBeInTheDocument();
    });
  });

  it('should reject non-VENDOR sessions (e.g. ADMIN) and show authentication required', async () => {
    const mockAdminUser = {
      id: 'admin-1',
      username: 'admin_user',
      email: 'admin@tobetake.dev',
      role: 'Admin',
      roleCode: 'ADMIN',
    };
    sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockAdminUser));

    render(
      <SellerRootLayout>
        <div data-testid="test-seller-child">Seller Page Content</div>
      </SellerRootLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Seller Authentication Required')).toBeInTheDocument();
      expect(screen.queryByTestId('test-seller-child')).not.toBeInTheDocument();
    });
  });

  it('should render isolated SellerShell with Sidebar, TopBar, and Scrollable Content when authenticated as VENDOR', async () => {
    const mockSellerUser = {
      id: 'seller-1',
      username: 'apex_merchant',
      email: 'contact@apextech.com',
      firstName: 'Apex',
      lastName: 'Merchant',
      role: 'Seller',
      roleCode: 'VENDOR',
      storeName: 'Apex Tech Solutions',
    };
    sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockSellerUser));

    const { container } = render(
      <SellerRootLayout>
        <div data-testid="test-seller-child">Seller Products Content</div>
      </SellerRootLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-seller-child')).toBeInTheDocument();
    });

    // Check Seller Shell structure matches the admin CSS system without top offset
    expect(container.querySelector('.admin-layout')).toBeInTheDocument();
    expect(container.querySelector('.admin-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.admin-main')).toBeInTheDocument();
    expect(container.querySelector('.admin-topbar')).toBeInTheDocument();
    expect(container.querySelector('.admin-content-scroll')).toBeInTheDocument();
    expect(container.querySelector('.admin-content')).toBeInTheDocument();

    // Verify exactly one layout shell is rendered
    expect(container.querySelectorAll('.admin-layout')).toHaveLength(1);
    expect(container.querySelectorAll('.admin-sidebar')).toHaveLength(1);
    expect(container.querySelectorAll('.admin-topbar')).toHaveLength(1);
  });

  it('should toggle mobile sidebar and display backdrop on mobile toggle', async () => {
    const mockSellerUser = {
      id: 'seller-1',
      username: 'apex_merchant',
      email: 'contact@apextech.com',
      firstName: 'Apex',
      lastName: 'Merchant',
      role: 'Seller',
      roleCode: 'VENDOR',
      storeName: 'Apex Tech Solutions',
    };
    sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockSellerUser));

    const { container } = render(
      <SellerRootLayout>
        <div data-testid="test-seller-child">Seller Page</div>
      </SellerRootLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-seller-child')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText('Toggle navigation menu');
    expect(toggleBtn).toBeInTheDocument();

    // Open sidebar
    fireEvent.click(toggleBtn);
    expect(container.querySelector('.admin-sidebar.open')).toBeInTheDocument();
    expect(container.querySelector('.admin-sidebar-backdrop')).toBeInTheDocument();

    // Click backdrop to close
    const backdrop = container.querySelector('.admin-sidebar-backdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(container.querySelector('.admin-sidebar-backdrop')).not.toBeInTheDocument();
  });
});
