import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLayout from './layout';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
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

describe('AdminLayout Component (/admin/* Shell)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render authentication required view when no user session is present', async () => {
    render(
      <AdminLayout>
        <div data-testid="test-admin-child">Admin Page Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Administrative Authentication Required')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In to Admin Portal →/i })).toBeInTheDocument();
      expect(screen.queryByTestId('test-admin-child')).not.toBeInTheDocument();
    });
  });

  it('should render isolated AdminShell with Sidebar, TopBar, and Scrollable Content when authenticated', async () => {
    const mockUser = {
      id: 'admin-1',
      username: 'superadmin',
      email: 'superadmin@tobetake.dev',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'Super Administrator',
      roleCode: 'SPADMIN',
    };
    sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockUser));

    const { container } = render(
      <AdminLayout>
        <div data-testid="test-admin-child">Admin Dashboard Page Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-admin-child')).toBeInTheDocument();
    });

    // Check Admin Shell structure
    expect(container.querySelector('.admin-layout')).toBeInTheDocument();
    expect(container.querySelector('.admin-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.admin-main')).toBeInTheDocument();
    expect(container.querySelector('.admin-topbar')).toBeInTheDocument();
    expect(container.querySelector('.admin-content-scroll')).toBeInTheDocument();
    expect(container.querySelector('.admin-content')).toBeInTheDocument();

    // Verify public landing navbar elements are not rendered
    expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
  });

  it('should toggle mobile sidebar and display backdrop on mobile toggle', async () => {
    const mockUser = {
      id: 'admin-1',
      username: 'superadmin',
      email: 'superadmin@tobetake.dev',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'Super Administrator',
      roleCode: 'SPADMIN',
    };
    sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockUser));

    const { container } = render(
      <AdminLayout>
        <div data-testid="test-admin-child">Admin Page</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-admin-child')).toBeInTheDocument();
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
