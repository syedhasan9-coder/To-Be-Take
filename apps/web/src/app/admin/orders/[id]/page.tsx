'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminOrderDetail, AdminOrderStatus } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function AdminOrderDetailPage(): React.ReactElement {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statusToUpdate, setStatusToUpdate] = useState<AdminOrderStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
      showToast('error', 'Failed to load order detail.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleUpdateStatus = async () => {
    if (!statusToUpdate) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusToUpdate,
          notes: statusNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update order status');
      showToast('success', `Order status successfully updated to ${statusToUpdate}`);
      setStatusToUpdate('');
      setStatusNotes('');
      fetchOrderDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to cancel order');
      showToast('success', 'Order has been cancelled.');
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrderDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          The requested order does not exist or has been removed.
        </p>
        <Link href="/admin/orders" className="admin-banner-action-btn primary">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/admin/orders"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-cream)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            ← Back to Orders
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              Order #{order.orderNumber}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Placed on {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AdminBadge status={order.status} />
          <AdminBadge status={order.paymentStatus} />
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--error-text)',
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Overview */}
      <div className="admin-dash-grid">
        {/* Left Column: Ordered Items & Financial Breakdown */}
        <div>
          {/* Items Card */}
          <div className="admin-dash-card" style={{ marginBottom: '1.5rem' }}>
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Ordered Products ({order.items.length})</span>
            </div>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Seller</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {item.productTitle || item.productName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          SKU: {item.sku || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {item.storeName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.sellerName}
                          </div>
                        </div>
                      </td>
                      <td>{formatPKR(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>
                        {formatPKR(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="admin-dash-card" style={{ marginBottom: '1.5rem' }}>
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Order Financial Summary</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                <span>{formatPKR(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping Fee:</span>
                <span>{formatPKR(order.shippingTotal || order.shippingAmount)}</span>
              </div>
              {Number(order.taxTotal || order.taxAmount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tax / Duty:</span>
                  <span>{formatPKR(order.taxTotal || order.taxAmount)}</span>
                </div>
              )}
              {Number(order.discountTotal || order.discountAmount || 0) > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--success-text)',
                  }}
                >
                  <span>Discount:</span>
                  <span>
                    -{formatPKR(order.discountTotal || order.discountAmount)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--color-forest-900)',
                }}
              >
                <span>Total Amount:</span>
                <span>
                  {formatPKR(order.total || order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Lifecycle Timeline */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Status History &amp; Timeline</span>
            </div>
            {order.statusHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No status transitions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.statusHistory.map((entry: any, idx: number) => (
                  <div
                    key={entry.id || idx}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      borderLeft: '2px solid var(--accent-gold)',
                      paddingLeft: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <AdminBadge status={entry.status || entry.toStatus} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem',
                          }}
                        >
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Status Transition Controls, Shipment Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Transition Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Update Lifecycle</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Change Status</label>
              <select
                value={statusToUpdate}
                onChange={(e) => setStatusToUpdate(e.target.value as AdminOrderStatus)}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">Select Next Status...</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.35rem' }}>
                Transition Notes (Optional)
              </label>
              <input
                type="text"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="e.g. Dispatched via courier"
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />

              <button
                type="button"
                disabled={!statusToUpdate || isUpdatingStatus}
                onClick={handleUpdateStatus}
                className="admin-banner-action-btn primary"
                style={{
                  marginTop: '0.5rem',
                  justifyContent: 'center',
                  opacity: !statusToUpdate || isUpdatingStatus ? 0.6 : 1,
                }}
              >
                {isUpdatingStatus ? 'Updating...' : 'Apply Status'}
              </button>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Customer Information</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.88rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                  Name
                </span>
                <span style={{ fontWeight: 600 }}>{order.customerName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                  Email
                </span>
                <span>{order.customerEmail}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                  Phone
                </span>
                <span>{order.customerPhone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Shipping Address</span>
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <div>{order.shippingAddress1 || 'No street address specified'}</div>
              {order.shippingAddress2 && <div>{order.shippingAddress2}</div>}
              <div>
                {[order.shippingCity, order.shippingState, order.shippingPostalCode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              <div>{order.shippingCountry}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <AdminModal
          isOpen={true}
          title={`Cancel Order #${order.orderNumber}`}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
          confirmLabel={isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          confirmVariant="danger"
          isSubmitting={isCancelling}
        >
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to cancel this order? This action will set the order status to
              CANCELLED and restore inventory.
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
              placeholder="e.g. Buyer requested cancellation"
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
