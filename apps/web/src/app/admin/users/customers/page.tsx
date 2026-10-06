'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ManagedUserItem, PaginatedResult, UserStatusType } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function CustomersManagementPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<ManagedUserItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<ManagedUserItem | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<ManagedUserItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<UserStatusType>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/users/customers?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      showToast('error', 'Failed to load customers. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenStatusModal = (user: ManagedUserItem, nextStatus: UserStatusType) => {
    setStatusModalUser(user);
    setTargetStatus(nextStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/users/${statusModalUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Status update failed.');
      }

      showToast(
        'success',
        `Customer '${statusModalUser.username}' status changed to ${targetStatus}`,
      );
      setStatusModalUser(null);
      fetchCustomers();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <AdminToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Tabs */}
      <div className="admin-tabs">
        <Link href="/admin/users/customers" className="admin-tab-btn active">
          Customers / Buyers
        </Link>
        <Link href="/admin/users/sellers" className="admin-tab-btn">
          Sellers / Vendors
        </Link>
        <Link href="/admin/users/admins" className="admin-tab-btn">
          Administrators
        </Link>
      </div>

      <div className="admin-page-header">
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Customer Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View, filter, manage, activate, or suspend registered buyer accounts across To Be Take.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="form-input"
              style={{ maxWidth: '320px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ maxWidth: '180px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Filter
            </button>
            {(search || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                Reset
              </button>
            )}
          </form>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{data.items.length}</strong> of <strong>{data.total}</strong> customers
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Username</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    <span className="spinner" style={{ marginRight: '0.5rem' }} />
                    Loading customers...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    No customer accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                data.items.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <Link
                        href={`/admin/users/customers/${cust.id}`}
                        style={{ fontWeight: 600, color: 'var(--color-forest-800)', textDecoration: 'none' }}
                      >
                        {cust.firstName} {cust.lastName}
                      </Link>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {cust.email}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.82rem', color: 'var(--color-forest-800)' }}>
                        @{cust.username}
                      </code>
                    </td>
                    <td>
                      <AdminBadge status={cust.status} />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: cust.isEmailVerified ? 'var(--success-text)' : 'var(--text-muted)',
                        }}
                      >
                        {cust.isEmailVerified ? '✓ Email Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/users/customers/${cust.id}`}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Customer 360 →
                        </Link>
                        {cust.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(cust, 'SUSPENDED')}
                            className="btn-secondary"
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.78rem',
                              color: '#dc2626',
                            }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(cust, 'ACTIVE')}
                            className="btn-secondary"
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.78rem',
                              color: '#166534',
                            }}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-secondary)',
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Customer: ${selectedUser.firstName} ${selectedUser.lastName}`}
          footer={
            <button type="button" onClick={() => setSelectedUser(null)} className="btn-secondary">
              Close
            </button>
          }
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              fontSize: '0.88rem',
            }}
          >
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Account ID
              </span>
              <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                {selectedUser.id}
              </span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Username
              </span>
              <span className="detail-value">@{selectedUser.username}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Email
              </span>
              <span className="detail-value">{selectedUser.email}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Status
              </span>
              <AdminBadge status={selectedUser.status} />
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Email Verification
              </span>
              <span>{selectedUser.isEmailVerified ? '✅ Verified' : '❌ Unverified'}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Registered At
              </span>
              <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
            </div>
            {selectedUser.lastLogin && (
              <div
                className="detail-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                  Last Active Login
                </span>
                <span>{new Date(selectedUser.lastLogin).toLocaleString()}</span>
              </div>
            )}

            {/* Customer Commerce Summary */}
            <div
              style={{
                marginTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--color-forest-900)' }}>
                  Customer Commerce History
                </span>
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(selectedUser.email)}`}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-forest-700)',
                    textDecoration: 'underline',
                  }}
                >
                  View All Orders →
                </Link>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Review real-time checkout volume, customer purchases, return disputes, and
                  transaction ledger directly through the central{' '}
                  <strong>Orders &amp; Payments</strong> consoles.
                </p>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirm Status Change Modal */}
      {statusModalUser && (
        <AdminModal
          isOpen={Boolean(statusModalUser)}
          onClose={() => setStatusModalUser(null)}
          title={`Confirm Account Status Change`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={targetStatus === 'ACTIVE' ? 'btn-admin' : 'btn-primary'}
                style={{
                  backgroundColor: targetStatus === 'SUSPENDED' ? '#dc2626' : undefined,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Confirm ${targetStatus}`}
              </button>
            </>
          }
        >
          <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            Are you sure you want to change the status of customer{' '}
            <strong>@{statusModalUser.username}</strong> ({statusModalUser.email}) to{' '}
            <strong>{targetStatus}</strong>?
          </p>
          <div className="form-group">
            <label className="form-label">Reason or Audit Note (Optional)</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Terms of service violation, customer request, etc."
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </AdminModal>
      )}
    </div>
  );
}
