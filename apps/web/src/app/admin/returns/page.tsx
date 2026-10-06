'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminReturnItem, AdminReturnStatus, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function AdminReturnsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminReturnItem>>({
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Action Modal
  const [reviewReturn, setReviewReturn] = useState<AdminReturnItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<AdminReturnStatus>('APPROVED');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/returns?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load returns:', err);
      showToast('error', 'Failed to load return requests.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReturns();
  };

  const handleConfirmReview = async () => {
    if (!reviewReturn) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/returns/${reviewReturn.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          refundAmount: refundAmount > 0 ? Number(refundAmount) : undefined,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update return request');
      showToast('success', `Return request status updated to ${targetStatus}.`);
      setReviewReturn(null);
      setRefundAmount(0);
      setAdminNotes('');
      fetchReturns();
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

      {/* Page Banner */}
      <div className="admin-welcome-banner">
        <div className="admin-welcome-inner">
          <div className="admin-welcome-tag">Customer Care &amp; Reverse Logistics</div>
          <h1 className="admin-welcome-title">Returns &amp; Refund Management</h1>
          <p className="admin-welcome-desc">
            Adjudicate buyer return requests, mediate disputes between customers and sellers,
            approve item intake, and authorize refund disbursements.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, return reason..."
              className="admin-search-input"
              style={{ maxWidth: '340px' }}
            />
            <button
              type="submit"
              className="admin-banner-action-btn primary"
              style={{ padding: '0.45rem 1rem' }}
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              background: '#ffffff',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Return Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="RECEIVED">Received</option>
            <option value="REFUNDED">Refunded</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Returns Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Seller Store</th>
                <th>Reason</th>
                <th>Refund (PKR)</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading return requests...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No return requests found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((ret) => (
                  <tr key={ret.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${ret.orderId}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-forest-700)',
                          textDecoration: 'underline',
                        }}
                      >
                        {ret.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ret.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ret.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ret.storeName}</span>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '240px',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {ret.reason}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {ret.refundAmount ? formatPKR(ret.refundAmount) : '—'}
                      </span>
                    </td>
                    <td>
                      <AdminBadge status={ret.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(ret.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewReturn(ret);
                          setTargetStatus(ret.status === 'REQUESTED' ? 'APPROVED' : ret.status);
                          setRefundAmount(Number(ret.refundAmount) || 0);
                          setAdminNotes(ret.adminNotes || '');
                        }}
                        className="admin-banner-action-btn primary"
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        Review
                      </button>
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
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {data.items.length} of {data.total} returns (Page {data.page} of{' '}
              {data.totalPages})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="admin-banner-action-btn"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-medium)',
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="admin-banner-action-btn"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-medium)',
                  opacity: page >= data.totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewReturn && (
        <AdminModal
          isOpen={true}
          title={`Review Return: Order #${reviewReturn.orderNumber}`}
          onClose={() => setReviewReturn(null)}
          onConfirm={handleConfirmReview}
          confirmLabel={isSubmitting ? 'Saving...' : 'Update Return Status'}
          confirmVariant={targetStatus === 'REJECTED' ? 'danger' : 'primary'}
          isSubmitting={isSubmitting}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg-cream)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                Customer: <strong>{reviewReturn.customerName}</strong>
              </div>
              <div>
                Vendor Store: <strong>{reviewReturn.storeName}</strong>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                Reason: <em>&ldquo;{reviewReturn.reason}&rdquo;</em>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Decision Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AdminReturnStatus)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="APPROVED">APPROVED (Authorized for return shipment)</option>
                <option value="RECEIVED">RECEIVED (Items arrived at seller/hub)</option>
                <option value="REFUNDED">REFUNDED (Refund processed)</option>
                <option value="REJECTED">REJECTED (Dispute dismissed)</option>
                <option value="CANCELLED">CANCELLED (Withdrawn)</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Refund Amount (PKR / Rs) (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Admin Decision Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes on return condition or justification for approval/rejection..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
