'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminOrderItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function AdminOrdersPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminOrderItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cancelModalOrder, setCancelModalOrder] = useState<AdminOrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      showToast('error', 'Failed to load orders list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${cancelModalOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to cancel order');
      showToast('success', `Order #${cancelModalOrder.orderNumber} has been cancelled.`);
      setCancelModalOrder(null);
      setCancelReason('');
      fetchOrders();
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

      {/* Page Header */}
      <div className="admin-welcome-banner">
        <div className="admin-welcome-inner">
          <div className="admin-welcome-tag">Commerce Core</div>
          <h1 className="admin-welcome-title">Marketplace Orders</h1>
          <p className="admin-welcome-desc">
            Monitor real-time customer purchases, track multi-vendor fulfillment pipelines, payment
            statuses, and handle order lifecycle governance.
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
              placeholder="Search by order #, customer name, email..."
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

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              <option value="">All Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
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
              <option value="PENDING">Payment Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Payment Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading orders...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      No orders found matching the filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-forest-700)',
                          textDecoration: 'underline',
                        }}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{order.itemsCount}</span> items
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{formatPKR(order.totalAmount)}</span>
                    </td>
                    <td>
                      <AdminBadge status={order.status} />
                    </td>
                    <td>
                      <AdminBadge status={order.paymentStatus} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="admin-banner-action-btn"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-forest-800)',
                            background: 'var(--bg-cream)',
                            borderColor: 'var(--border-medium)',
                          }}
                        >
                          View Detail
                        </Link>
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() => setCancelModalOrder(order)}
                            style={{
                              padding: '0.25rem 0.65rem',
                              fontSize: '0.75rem',
                              color: 'var(--error-text)',
                              background: 'var(--error-bg)',
                              border: '1px solid var(--error-border)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Cancel
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
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {data.items.length} of {data.total} orders (Page {data.page} of{' '}
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

      {/* Cancellation Modal */}
      {cancelModalOrder && (
        <AdminModal
          isOpen={true}
          title={`Cancel Order #${cancelModalOrder.orderNumber}`}
          onClose={() => setCancelModalOrder(null)}
          onConfirm={handleConfirmCancel}
          confirmLabel={isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          confirmVariant="danger"
          isSubmitting={isSubmitting}
        >
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to cancel this order? This will release reserved inventory back
              to available stock.
            </p>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginBottom: '0.35rem',
              }}
            >
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation before dispatch"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </AdminModal>
      )}
    </div>
  );
}
