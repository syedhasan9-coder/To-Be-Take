import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuditLogsPage from './page';

describe('AuditLogsPage (/admin/audit-logs)', () => {
  const mockAuditLogsData = {
    items: [
      {
        id: 'log-12345678-uuid',
        actorId: 'admin-1',
        actorName: 'Admin User',
        actorEmail: 'admin@tobetake.dev',
        actorRole: 'ADMIN',
        action: 'SELLER_APPROVED',
        targetType: 'SellerApproval',
        targetId: 'seller-store-id',
        status: 'SUCCESS',
        details: JSON.stringify({ reason: 'Approved application' }),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date().toISOString(),
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAuditLogsData }),
      }),
    );
  });

  it('should render audit logs table with action, actor, and export button', async () => {
    render(<AuditLogsPage />);

    expect(screen.getByText('System & Administrative Audit Logs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SELLER_APPROVED')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inspect' })).toBeInTheDocument();
    });
  });
});
