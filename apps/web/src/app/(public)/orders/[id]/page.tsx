'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '../../../../lib/customer-api';
import { OrderTrackingTimeline } from '../../../../components/customer/OrderTrackingTimeline';

export default function OrderDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await customerApi.getOrderDetail(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#526359' }}>Loading order consignment details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: '#526359', margin: '1rem 0 1.5rem' }}>
          We could not locate this order or tracking number.
        </p>
        <Link href="/account/orders" className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px' }}>
          View My Orders
        </Link>
      </div>
    );
  }

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await customerApi.cancelOrder(order.id, cancelReason);
      setCancelModalOpen(false);
      const refreshed = await customerApi.getOrderDetail(orderId);
      setOrder(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await customerApi.requestReturn(order.id, returnReason);
      setReturnModalOpen(false);
      const refreshed = await customerApi.getOrderDetail(orderId);
      setOrder(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to submit return request.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Success Confirmation Header */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8e3d9',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#e6f4ec',
              color: '#196338',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✓
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', background: '#f8f5ee', color: '#526359', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
              Order Confirmed
            </span>
            <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.85rem', fontWeight: 700, color: '#14291f', margin: '0.35rem 0 0.15rem' }}>
              Order #{order.orderNumber}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#526359', margin: 0 }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {order.canCancel && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              style={{
                background: '#fdf2f2',
                color: '#a82323',
                border: '1px solid #f8c8c8',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel Order
            </button>
          )}

          {order.canReturn && (
            <button
              type="button"
              onClick={() => setReturnModalOpen(true)}
              style={{
                background: '#f8f5ee',
                color: '#14291f',
                border: '1px solid #dcd5c7',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Request Return / Refund
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: '#14291f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🖨️ Print Invoice
          </button>
        </div>
      </div>

      {/* 6-Stage Timeline Component */}
      <div style={{ marginBottom: '2rem' }}>
        <OrderTrackingTimeline
          timeline={order.timeline}
          currentStatus={order.status}
          carrier={order.tracking?.carrier}
          trackingNumber={order.tracking?.trackingNumber}
        />
      </div>

      {/* Order Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Items in Order */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0ebe1' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
              Purchased Items ({order.items?.length || 0})
            </h3>
          </div>

          <div>
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f0ebe1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                }}
              >
                <div style={{ width: '70px', height: '70px', borderRadius: '8px', background: '#f8f5ee', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/products/${item.slug || item.productId}`} style={{ textDecoration: 'none', color: '#14291f' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                      {item.title}
                    </h4>
                  </Link>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0 0 0.25rem' }}>
                    Merchant: <strong>{item.seller?.storeName || 'Verified Artisan'}</strong>
                  </p>
                  <div style={{ fontSize: '0.8125rem', color: '#82948a' }}>
                    Qty: {item.quantity} × Rs. {Number(item.price).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14291f' }}>
                  Rs. {Number(item.totalPrice).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '1.25rem 1.5rem', background: '#fdfcf7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#526359' }}>Order Total</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14291f' }}>
              Rs. {Number(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Shipping Address & Payment Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Shipping Address */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14291f', marginBottom: '0.75rem' }}>
              📍 Delivery Destination
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#14291f', lineHeight: 1.5, margin: 0 }}>
              {typeof order.shippingAddress === 'string'
                ? order.shippingAddress
                : `${order.shippingAddress?.recipientName}, ${order.shippingAddress?.phone}, ${order.shippingAddress?.streetAddress}, ${order.shippingAddress?.city}, ${order.shippingAddress?.province}`}
            </p>
          </div>

          {/* Payment Method */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14291f', marginBottom: '0.75rem' }}>
              💳 Payment Information
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#14291f', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>Method: <strong>{order.payment?.method}</strong></div>
              <div>Payment Status: <strong style={{ color: order.payment?.status === 'PAID' ? '#196338' : '#d4a34b' }}>{order.payment?.status}</strong></div>
              {order.payment?.transactionId && order.payment.transactionId !== 'N/A' && (
                <div style={{ fontSize: '0.75rem', color: '#82948a' }}>Ref: {order.payment.transactionId}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '450px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14291f', marginBottom: '0.75rem' }}>
              Cancel Order #{order.orderNumber}?
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#526359', marginBottom: '1.25rem' }}>
              Are you sure you want to cancel this order? Any reserved inventory will be released.
            </p>
            <form onSubmit={handleCancelOrder}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Changed mind, ordered by mistake"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee', fontWeight: 600, cursor: 'pointer' }}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', background: '#a82323', color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '450px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14291f', marginBottom: '0.75rem' }}>
              Return / Refund Request
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#526359', marginBottom: '1.25rem' }}>
              ToBeTake 7-Day Guarantee: Request a return or replacement for this delivered order.
            </p>
            <form onSubmit={handleRequestReturn}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Reason for Return
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue with the item (e.g. damaged during courier transit, incorrect size)..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 700 }}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
