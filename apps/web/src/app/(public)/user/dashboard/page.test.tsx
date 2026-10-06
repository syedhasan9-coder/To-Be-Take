import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserDashboardPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

describe('UserDashboardPage Component (/user/dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Unauthenticated Access State', () => {
    it('should display authentication required card when no user session exists', () => {
      render(<UserDashboardPage />);

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Buyer Workspace' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /you are not currently signed in\. please authenticate with your buyer credentials/i,
        ),
      ).toBeInTheDocument();

      const signInLink = screen.getByRole('link', { name: 'Sign In as Buyer →' });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login/user');

      const homeLink = screen.getByRole('link', { name: 'Back to Home' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Authenticated Access State', () => {
    const mockUser = {
      id: 'buyer-123',
      username: 'buyer_bilal',
      email: 'bilal.buyer@tobetake.dev',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      role: 'Buyer',
      roleCode: 'CUST',
    };

    beforeEach(() => {
      sessionStorage.setItem('tobetake_auth_user', JSON.stringify(mockUser));
    });

    it('should render authenticated user details and workspace controls', () => {
      render(<UserDashboardPage />);

      expect(
        screen.getByRole('heading', { level: 1, name: 'Welcome to Buyer Workspace, Bilal Ahmed' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('buyer_bilal')).toBeInTheDocument();
      expect(screen.getByText('bilal.buyer@tobetake.dev')).toBeInTheDocument();
      expect(screen.getByText('CUST')).toBeInTheDocument();
    });

    it('should handle sign out correctly, clearing session storage and redirecting to /login/user', () => {
      render(<UserDashboardPage />);

      const signOutBtn = screen.getByRole('button', { name: 'Sign Out' });
      expect(signOutBtn).toBeInTheDocument();

      fireEvent.click(signOutBtn);

      expect(sessionStorage.getItem('tobetake_auth_user')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login/user');
    });
  });
});
