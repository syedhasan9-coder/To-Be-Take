import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminNotificationsPage from './page';

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

describe('AdminNotificationsPage Component (/admin/notifications)', () => {
  const mockNotificationsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'notif-1',
          type: 'SELLER_APPROVAL',
          title: 'New Vendor Store Application',
          message: 'Awaiting onboarding verification for Botanica Gifts',
          isRead: false,
          linkUrl: '/admin/seller-approvals',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      unreadCount: 1,
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotificationsResponse),
      }),
    );
  });

  it('should render notification center alerts and unread count', async () => {
    render(<AdminNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Center')).toBeInTheDocument();
      expect(screen.getByText('New Vendor Store Application')).toBeInTheDocument();
      expect(
        screen.getByText('Awaiting onboarding verification for Botanica Gifts'),
      ).toBeInTheDocument();
      expect(screen.getByText('✓ Mark All (1) as Read')).toBeInTheDocument();
    });
  });

  it('should trigger mark all as read', async () => {
    render(<AdminNotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('✓ Mark All (1) as Read')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✓ Mark All (1) as Read'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/notifications/mark-all-read',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
