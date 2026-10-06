'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminPaymentItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function AdminPaymentsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminPaymentItem>>({
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

  // Refund Modal
  const [refundPayment, setRefundPayment] = useState<AdminPaymentItem | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      showToast('error', 'Failed to load payments transaction ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleConfirmRefund = async () => {
    if (!refundPayment) return;
    if (refundAmount <= 0) {
      showToast('error', 'Refund amount must be greater than zero.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/payments/${refundPayment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundAmount: Number(refundAmount),
          reason: refundReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Refund processing failed');
      showToast('success', `Refund of ${formatPKR(refundAmount)} recorded.`);
      setRefundPayment(null);
      setRefundAmount(0);
      setRefundReason('');
      fetchPayments();
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
          <div className="admin-welcome-tag">Marketplace Treasury</div>
          <h1 className="admin-welcome-title">Payments &amp; Transactions</h1>
          <p className="admin-welcome-desc">
            Review customer gateway settlements, transaction reference IDs, multi-vendor splits,
            payment provider states, and process refunds.
          </p>
        </div>
      </div>

      {/* Table Container */}
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
              placeholder="Search by transaction ID, order #, customer..."
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
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction / Ref</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Settled At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading payments...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No transactions found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((pmt) => (
                  <tr key={pmt.id}>
                    <td>
                      <div>
                        <code
                          style={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            background: 'var(--bg-cream)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                          }}
                        >
                          {pmt.transactionReference || pmt.transactionId || pmt.providerRef || pmt.id.slice(0, 10)}
                        </code>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.2rem',
                          }}
                        >
                          Method: {pmt.paymentMethod || pmt.method || 'Electronic'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/admin/orders/${pmt.orderId}`}
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-forest-700)',
                          textDecoration: 'underline',
                        }}
                      >
                        {pmt.orderNumber || pmt.orderId}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {pmt.customerName || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {pmt.customerEmail || ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pmt.paymentMethod || pmt.method || 'Standard'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {formatPKR(pmt.amount)}
                      </span>
                    </td>
                    <td>
                      <AdminBadge status={pmt.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {pmt.settledAt
                          ? new Date(pmt.settledAt).toLocaleDateString()
                          : new Date(pmt.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      {pmt.status === 'PAID' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundPayment(pmt);
                            setRefundAmount(pmt.amount);
                            setRefundReason('');
                          }}
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'var(--error-bg)',
                            color: 'var(--error-text)',
                            border: '1px solid var(--error-border)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Refund
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
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
              Showing {data.items.length} of {data.total} payments (Page {data.page} of{' '}
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

      {/* Refund Modal */}
      {refundPayment && (
        <AdminModal
          isOpen={true}
          title={`Process Payment Refund (${refundPayment.orderNumber})`}
          onClose={() => setRefundPayment(null)}
          onConfirm={handleConfirmRefund}
          confirmLabel={isSubmitting ? 'Processing...' : 'Confirm Refund'}
          confirmVariant="danger"
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
                Order: <strong>{refundPayment.orderNumber}</strong>
              </div>
              <div>
                Customer: <strong>{refundPayment.customerName}</strong>
              </div>
              <div>
                Original Charge: <strong>{formatPKR(refundPayment.amount)}</strong>
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
                Refund Amount (PKR / Rs) *
              </label>
              <input
                type="number"
                step="0.01"
                max={refundPayment.amount}
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
                Reason for Refund
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Return approved, out of stock cancellation..."
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
