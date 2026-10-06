'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ManagedUserItem, PaginatedResult, UserStatusType } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function SellersManagementPage(): React.ReactElement {
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

  const fetchSellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/users/sellers?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load sellers:', err);
      showToast('error', 'Failed to load seller records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSellers();
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
        `Seller '${statusModalUser.storeName || statusModalUser.username}' status updated to ${targetStatus}`,
      );
      setStatusModalUser(null);
      fetchSellers();
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
        <Link href="/admin/users/customers" className="admin-tab-btn">
          Customers / Buyers
        </Link>
        <Link href="/admin/users/sellers" className="admin-tab-btn active">
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
            Seller &amp; Store Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Oversee marketplace vendor accounts, review storefront status, manage operations, and
            enforce store policies.
          </p>
        </div>
        <Link href="/admin/seller-approvals" className="btn-admin">
          Go to Seller Approvals Queue →
        </Link>
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
              placeholder="Search store name, category, owner..."
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
            Showing <strong>{data.items.length}</strong> of <strong>{data.total}</strong> sellers
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Store &amp; Category</th>
                <th>Owner Details</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Joined</th>
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
                    Loading seller accounts...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    No seller accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                data.items.map((seller) => (
                  <tr key={seller.id}>
                    <td>
                      <Link
                        href={`/admin/users/sellers/${seller.id}`}
                        style={{ fontWeight: 700, color: 'var(--color-forest-800)', textDecoration: 'none' }}
                      >
                        {seller.storeName || 'Unnamed Storefront'}
                      </Link>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold-text)' }}>
                        {seller.businessCategory || 'General Merchandise'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {seller.firstName} {seller.lastName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        @{seller.username} • {seller.email}
                      </div>
                    </td>
                    <td>
                      <AdminBadge status={seller.status} />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: seller.isEmailVerified
                            ? 'var(--success-text)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {seller.isEmailVerified ? '✓ Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(seller.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/users/sellers/${seller.id}`}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Seller 360 →
                        </Link>
                        {seller.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(seller, 'SUSPENDED')}
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
                            onClick={() => handleOpenStatusModal(seller, 'ACTIVE')}
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

      {/* Seller Details Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Store: ${selectedUser.storeName || selectedUser.username}`}
          footer={
            <div
              style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}
            >
              <Link
                href="/admin/seller-approvals"
                className="btn-admin"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                View in Approvals Queue →
              </Link>
              <button type="button" onClick={() => setSelectedUser(null)} className="btn-secondary">
                Close
              </button>
            </div>
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
                Store Name
              </span>
              <span className="detail-value" style={{ fontWeight: 700 }}>
                {selectedUser.storeName || 'N/A'}
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
                Business Category
              </span>
              <span className="detail-value">{selectedUser.businessCategory || 'N/A'}</span>
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
                Store Owner
              </span>
              <span className="detail-value">
                {selectedUser.firstName} {selectedUser.lastName} (@{selectedUser.username})
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
                Contact Email
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
                Registered At
              </span>
              <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
            </div>

            {/* Seller Commerce Context Links */}
            <div
              style={{
                marginTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--color-forest-900)',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Store Marketplace Consoles
              </span>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}
              >
                <Link
                  href={`/admin/products?search=${encodeURIComponent(selectedUser.storeName || selectedUser.username)}`}
                  className="admin-quick-action-btn"
                  style={{ fontSize: '0.78rem' }}
                >
                  📦 Products Catalog →
                </Link>
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(selectedUser.storeName || selectedUser.username)}`}
                  className="admin-quick-action-btn"
                  style={{ fontSize: '0.78rem' }}
                >
                  🛒 Store Orders →
                </Link>
                <Link
                  href={`/admin/commissions?search=${encodeURIComponent(selectedUser.storeName || selectedUser.username)}`}
                  className="admin-quick-action-btn"
                  style={{ fontSize: '0.78rem' }}
                >
                  📊 Commissions →
                </Link>
                <Link
                  href={`/admin/payouts?search=${encodeURIComponent(selectedUser.storeName || selectedUser.username)}`}
                  className="admin-quick-action-btn"
                  style={{ fontSize: '0.78rem' }}
                >
                  💵 Payouts Ledger →
                </Link>
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
          title={`Confirm Seller Status Change`}
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
            Are you sure you want to change the status of seller store{' '}
            <strong>{statusModalUser.storeName || statusModalUser.username}</strong> to{' '}
            <strong>{targetStatus}</strong>?
          </p>
          <div className="form-group">
            <label className="form-label">Audit Note / Reason (Optional)</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Compliance review passed, store suspension requested, etc."
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
