'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { OrderDetailItem } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerOrderDetailPage(): React.ReactElement {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sellerFetch(`/api/seller/orders/${orderId}`);

      if (!res.ok) {
        throw new Error('Order not found or does not contain items from your store.');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        setSelectedStatus(json.data.status);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsUpdatingStatus(true);
    try {
      const res = await sellerFetch(`/api/seller/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: selectedStatus,
          notes: statusNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update order status');
      }

      showToast('success', `Order status transitioned to ${selectedStatus}`);
      fetchOrder();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading fulfillment details...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
            Order Unavailable
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{errorMessage}</p>
          <Link href="/seller/orders" className="btn-seller">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const commission = order.commissions[0];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              color: '#ffffff',
              background: t.type === 'success' ? '#15803d' : '#b91c1c',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/seller/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-forest-700, #2d6a4f)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Back to Orders List
        </Link>
      </div>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: '#faf8f5',
          borderColor: '#e2d9cc',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1b4332', margin: 0 }}>
              {order.orderNumber}
            </h1>
            <span
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background:
                  order.status === 'DELIVERED'
                    ? 'rgba(22, 163, 74, 0.1)'
                    : order.status === 'CANCELLED'
                      ? '#fef2f2'
                      : 'rgba(217, 119, 6, 0.1)',
                color:
                  order.status === 'DELIVERED'
                    ? '#15803d'
                    : order.status === 'CANCELLED'
                      ? '#991b1b'
                      : '#b45309',
              }}
            >
              {order.status}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Your Order Subtotal
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332' }}>
            {formatPKR(order.total)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer & Delivery Information */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Delivery &amp; Customer Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>Recipient Name</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{order.customerName}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>Customer Email</span>
              <span style={{ color: '#1e293b' }}>{order.customerEmail}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>Fulfillment Shipping Address</span>
              <span style={{ color: '#1e293b', whiteSpace: 'pre-line' }}>
                {order.shippingAddress || 'Standard Marketplace Delivery Address'}
              </span>
            </div>
            {order.customerNotes && (
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 700 }}>Customer Order Notes</span>
                <span style={{ color: '#334155', fontStyle: 'italic' }}>&ldquo;{order.customerNotes}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* Fulfillment & Status Control */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Update Fulfillment State
          </h2>

          <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Fulfillment Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  background: '#ffffff',
                }}
              >
                <option value="PROCESSING">Processing / Preparing</option>
                <option value="SHIPPED">Shipped / In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancel Order</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Fulfillment Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dispatched via Express Courier"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="btn-seller"
              style={{ width: '100%', padding: '0.6rem' }}
            >
              {isUpdatingStatus ? 'Updating Status...' : 'Apply Fulfillment Update'}
            </button>
          </form>
        </div>
      </div>

      {/* Your Order Items Table */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', marginBottom: '1rem' }}>
          Items From Your Store
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Item / SKU</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Quantity</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Unit Price</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700, textAlign: 'right' }}>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#1b4332' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                      SKU: {item.sku}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#1e293b' }}>
                    {formatPKR(item.unitPrice)}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#1b4332', textAlign: 'right' }}>
                    {formatPKR(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Settlement Breakdown Card */}
      {commission && (
        <div className="card" style={{ padding: '1.5rem', background: '#faf8f5', borderColor: '#e2d9cc' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' }}>
            Financial Breakdown &amp; Commission Settlement
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700 }}>Item Gross Value</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1b4332' }}>
                {formatPKR(commission.orderAmount)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700 }}>Marketplace Fee ({Number(commission.commissionRate)}%)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c' }}>
                -{formatPKR(commission.platformFee)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700 }}>Your Net Settlement</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                {formatPKR(commission.sellerEarnings)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700 }}>Payout Settlement Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                {commission.status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
