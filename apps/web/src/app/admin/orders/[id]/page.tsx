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

  // Manual Courier Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingCarrier, setBookingCarrier] = useState<string>('TCS');
  const [bookingTrackingNumber, setBookingTrackingNumber] = useState<string>('');
  const [bookingTrackingUrl, setBookingTrackingUrl] = useState<string>('');
  const [bookingRecipientName, setBookingRecipientName] = useState<string>('');
  const [bookingRecipientPhone, setBookingRecipientPhone] = useState<string>('');
  const [bookingDestinationCity, setBookingDestinationCity] = useState<string>('');
  const [bookingDestinationAddress, setBookingDestinationAddress] = useState<string>('');
  const [bookingWeightKg, setBookingWeightKg] = useState<number>(0.5);
  const [bookingPieces, setBookingPieces] = useState<number>(1);
  const [bookingShippingCharges, setBookingShippingCharges] = useState<number>(0);
  const [bookingCodAmount, setBookingCodAmount] = useState<number>(0);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [isBookingShipment, setIsBookingShipment] = useState<boolean>(false);

  // COD Remittance Settlement Modal State
  const [showCodModal, setShowCodModal] = useState<boolean>(false);
  const [remittanceRef, setRemittanceRef] = useState<string>('');
  const [remittanceAmount, setRemittanceAmount] = useState<number>(0);
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [remittanceNotes, setRemittanceNotes] = useState<string>('');
  const [isSettlingCod, setIsSettlingCod] = useState<boolean>(false);

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
        const o = json.data;
        setOrder(o);
        setBookingRecipientName(o.customerName || '');
        setBookingRecipientPhone(o.customerPhone || '');
        setBookingDestinationCity(o.shippingCity || 'Pakistan');
        setBookingDestinationAddress(o.shippingAddress || o.shippingAddress1 || '');
        setBookingShippingCharges(Number(o.shippingTotal || o.shippingAmount || 0));
        const expectedCod =
          o.codSummary?.expectedCodAmount !== undefined
            ? Number(o.codSummary.expectedCodAmount)
            : o.paymentStatus === 'PAID'
            ? 0
            : Number(o.total || o.totalAmount || 0);
        setBookingCodAmount(expectedCod);
        setRemittanceAmount(expectedCod);
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

  const handleOpenBookingModal = () => {
    if (!order) return;
    setBookingRecipientName(order.customerName || '');
    setBookingRecipientPhone(order.customerPhone || '');
    setBookingDestinationCity(order.shippingCity || 'Pakistan');
    setBookingDestinationAddress(order.shippingAddress || order.shippingAddress1 || '');
    setBookingShippingCharges(Number(order.shippingTotal || order.shippingAmount || 0));
    const expected =
      order.codSummary?.expectedCodAmount !== undefined
        ? Number(order.codSummary.expectedCodAmount)
        : order.paymentStatus === 'PAID'
        ? 0
        : Number(order.total || order.totalAmount || 0);
    setBookingCodAmount(expected);
    setBookingTrackingNumber('');
    setBookingNotes('');
    setShowBookingModal(true);
  };

  const handleConfirmShipmentBooking = async () => {
    if (!bookingTrackingNumber.trim()) {
      showToast('error', 'A genuine tracking / AWB number is required for booking.');
      return;
    }
    setIsBookingShipment(true);
    try {
      const res = await adminFetch(`/api/admin/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          carrier: bookingCarrier,
          trackingNumber: bookingTrackingNumber.trim(),
          trackingUrl: bookingTrackingUrl.trim() || undefined,
          recipientName: bookingRecipientName.trim() || undefined,
          recipientPhone: bookingRecipientPhone.trim() || undefined,
          destinationCity: bookingDestinationCity.trim() || undefined,
          destinationAddress: bookingDestinationAddress.trim() || undefined,
          weightKg: Number(bookingWeightKg) || 0.5,
          pieces: Number(bookingPieces) || 1,
          shippingCharges: Number(bookingShippingCharges) || 0,
          codAmount: Number(bookingCodAmount) || 0,
          notes: bookingNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to book shipment');
      showToast('success', `Shipment booked with ${bookingCarrier} (Tracking: ${bookingTrackingNumber.trim()})`);
      setShowBookingModal(false);
      fetchOrderDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsBookingShipment(false);
    }
  };

  const handleOpenCodModal = () => {
    if (!order) return;
    const expected =
      order.codSummary?.expectedCodAmount !== undefined
        ? Number(order.codSummary.expectedCodAmount)
        : Number(order.total || order.totalAmount || 0);
    setRemittanceAmount(expected);
    setRemittanceRef('');
    setRemittanceNotes('');
    setShowCodModal(true);
  };

  const handleConfirmCodSettlement = async () => {
    if (!remittanceRef.trim()) {
      showToast('error', 'A courier remittance reference is required.');
      return;
    }
    setIsSettlingCod(true);
    try {
      const res = await adminFetch(`/api/admin/shipping/orders/${orderId}/cod-settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remittanceReference: remittanceRef.trim(),
          amountReceived: Number(remittanceAmount),
          settlementDate,
          notes: remittanceNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to record remittance');
      if (json.data?.reconciliationStatus === 'DISCREPANCY') {
        showToast('error', `Warning: Remittance has a discrepancy of PKR ${json.data.difference}. Flagged for review.`);
      } else {
        showToast('success', 'COD remittance successfully verified and settled.');
      }
      setShowCodModal(false);
      fetchOrderDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSettlingCod(false);
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

  const primaryShipment = order.shipments && order.shipments.length > 0 ? order.shipments[0] : null;
  const isCodOrder =
    order.codSummary?.isCodOrder ??
    (order.payments?.some((p) => p.paymentMethod === 'COD') || order.paymentStatus === 'PENDING');
  const expectedCodAmount =
    order.codSummary?.expectedCodAmount !== undefined
      ? Number(order.codSummary.expectedCodAmount)
      : Number(order.total || order.totalAmount || 0);

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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <AdminBadge status={order.status} />
          <AdminBadge status={order.paymentStatus} />

          {/* Quick Action: Book Shipment */}
          {!primaryShipment && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="admin-banner-action-btn primary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
            >
              🚚 Book Courier Shipment
            </button>
          )}

          {/* Quick Action: Record COD Settlement */}
          {isCodOrder && order.codSummary?.reconciliationStatus !== 'SETTLED' && (
            <button
              type="button"
              onClick={handleOpenCodModal}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#854d0e',
                background: '#fef9c3',
                border: '1px solid #fde047',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              💵 Record COD Remittance
            </button>
          )}

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

        {/* Right Column: Courier Shipping, COD Settlement, Customer Details, Status Transition Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Courier Logistics & Booking Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="admin-dash-card-title">Courier Logistics &amp; AWB</span>
              {primaryShipment && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-cream)', fontWeight: 600 }}>
                  Mode: {primaryShipment.bookingMode || 'MANUAL'}
                </span>
              )}
            </div>

            {primaryShipment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Carrier</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-900)' }}>{primaryShipment.carrier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>AWB / Tracking Number</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {primaryShipment.trackingNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Shipment Status</span>
                  <AdminBadge status={primaryShipment.status} size="sm" />
                </div>
                {primaryShipment.weightKg !== null && primaryShipment.weightKg !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Weight &amp; Pieces</span>
                    <span>{primaryShipment.weightKg} kg • {primaryShipment.pieces || 1} pcs</span>
                  </div>
                )}
                {primaryShipment.codAmount !== null && primaryShipment.codAmount !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>COD Collection Amount</span>
                    <span style={{ fontWeight: 600 }}>{formatPKR(primaryShipment.codAmount)}</span>
                  </div>
                )}
                {primaryShipment.shippedDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Dispatched Date</span>
                    <span>{new Date(primaryShipment.shippedDate).toLocaleString()}</span>
                  </div>
                )}
                {primaryShipment.trackingUrl && (
                  <a
                    href={primaryShipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-banner-action-btn primary"
                    style={{ marginTop: '0.5rem', textAlign: 'center', display: 'block', textDecoration: 'none' }}
                  >
                    Track on Courier Portal ↗
                  </a>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  📦 Awaiting courier dispatch. No active shipment booked yet.
                </div>
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                  <button
                    type="button"
                    onClick={handleOpenBookingModal}
                    className="admin-banner-action-btn primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    + Book Shipment with Courier
                  </button>
                )}
              </div>
            )}
          </div>

          {/* COD Collection & Remittance Settlement Card */}
          {isCodOrder && (
            <div className="admin-dash-card">
              <div className="admin-dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-dash-card-title">COD Collection &amp; Remittance</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    backgroundColor:
                      order.codSummary?.reconciliationStatus === 'SETTLED'
                        ? '#dcfce7'
                        : order.codSummary?.reconciliationStatus === 'DISCREPANCY'
                        ? '#fee2e2'
                        : '#fef3c7',
                    color:
                      order.codSummary?.reconciliationStatus === 'SETTLED'
                        ? '#15803d'
                        : order.codSummary?.reconciliationStatus === 'DISCREPANCY'
                        ? '#b91c1c'
                        : '#b45309',
                  }}
                >
                  {order.codSummary?.reconciliationStatus || 'PENDING'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Expected COD Collection</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-900)' }}>
                    {formatPKR(expectedCodAmount)}
                  </span>
                </div>

                {order.codSummary?.remittanceReference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Remittance Reference</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {order.codSummary.remittanceReference}
                    </span>
                  </div>
                )}

                {order.codSummary?.amountReceived !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Amount Received</span>
                    <span style={{ fontWeight: 700, color: '#15803d' }}>
                      {formatPKR(order.codSummary.amountReceived)}
                    </span>
                  </div>
                )}

                {order.codSummary?.reconciliationStatus === 'DISCREPANCY' && (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem',
                      color: '#9f1239',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ Remittance amount discrepancy flagged! Amount received does not match expected COD total. Please verify courier settlement slip.
                  </div>
                )}

                {order.codSummary?.reconciliationStatus !== 'SETTLED' && (
                  <button
                    type="button"
                    onClick={handleOpenCodModal}
                    className="admin-banner-action-btn secondary"
                    style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                  >
                    Record Courier Remittance
                  </button>
                )}
              </div>
            </div>
          )}

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
              <div>{order.shippingAddress1 || order.shippingAddress || 'No street address specified'}</div>
              {order.shippingAddress2 && <div>{order.shippingAddress2}</div>}
              <div>
                {[order.shippingCity, order.shippingState, order.shippingPostalCode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              <div>{order.shippingCountry || 'Pakistan'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Courier Booking Modal */}
      {showBookingModal && (
        <AdminModal
          isOpen={true}
          title={`Book Courier Shipment — Order #${order.orderNumber}`}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleConfirmShipmentBooking}
          confirmLabel={isBookingShipment ? 'Booking & Dispatching...' : 'Confirm Shipment & Dispatch'}
          confirmVariant="primary"
          isSubmitting={isBookingShipment}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
              ℹ️ <strong>Manual Booking Mode:</strong> Real consignment/AWB tracking number is required. Do not use synthetic or placeholder tracking codes.
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Courier Provider *
              </label>
              <select
                value={bookingCarrier}
                onChange={(e) => setBookingCarrier(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              >
                <option value="TCS">TCS Express Pakistan (Manual AWB)</option>
                <option value="LEOPARDS">Leopards Courier (Manual CN)</option>
                <option value="TRAX">Trax Express Logistics</option>
                <option value="MANUAL">Other Supported Courier (Manual Entry)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Real Tracking / AWB Number *
              </label>
              <input
                type="text"
                value={bookingTrackingNumber}
                onChange={(e) => setBookingTrackingNumber(e.target.value)}
                placeholder="e.g. 1234567890 or TCS-CONSIGNMENT-ID"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={bookingRecipientName}
                  onChange={(e) => setBookingRecipientName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Recipient Phone
                </label>
                <input
                  type="text"
                  value={bookingRecipientPhone}
                  onChange={(e) => setBookingRecipientPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Destination Address &amp; City
              </label>
              <input
                type="text"
                value={bookingDestinationAddress}
                onChange={(e) => setBookingDestinationAddress(e.target.value)}
                placeholder="Street address"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem', marginBottom: '0.35rem' }}
              />
              <input
                type="text"
                value={bookingDestinationCity}
                onChange={(e) => setBookingDestinationCity(e.target.value)}
                placeholder="Destination City"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={bookingWeightKg}
                  onChange={(e) => setBookingWeightKg(parseFloat(e.target.value) || 0.5)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Pieces
                </label>
                <input
                  type="number"
                  min="1"
                  value={bookingPieces}
                  onChange={(e) => setBookingPieces(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  COD Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bookingCodAmount}
                  onChange={(e) => setBookingCodAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Booking / Dispatch Notes (Optional)
              </label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Fragile parcel, packed in 2-ply carton"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* Record COD Remittance Modal */}
      {showCodModal && (
        <AdminModal
          isOpen={true}
          title={`Record COD Courier Remittance — Order #${order.orderNumber}`}
          onClose={() => setShowCodModal(false)}
          onConfirm={handleConfirmCodSettlement}
          confirmLabel={isSettlingCod ? 'Verifying...' : 'Verify & Record Remittance'}
          confirmVariant="primary"
          isSubmitting={isSettlingCod}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Expected COD Collection:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-forest-900)' }}>{formatPKR(expectedCodAmount)}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Calculated using order total minus any verified prepayments.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Courier Remittance Reference *
              </label>
              <input
                type="text"
                value={remittanceRef}
                onChange={(e) => setRemittanceRef(e.target.value)}
                placeholder="e.g. TCS-REMIT-90812 or Bank Slip / Voucher ID"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Amount Received (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={remittanceAmount}
                  onChange={(e) => setRemittanceAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  Settlement Date *
                </label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {Math.abs(expectedCodAmount - remittanceAmount) > 0.01 && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '0.65rem', color: '#9f1239', fontSize: '0.82rem' }}>
                ⚠️ <strong>Discrepancy Detected:</strong> Difference of PKR {(expectedCodAmount - remittanceAmount).toFixed(2)}. The payment will be flagged for review rather than marked settled.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                Reconciliation Notes (Optional)
              </label>
              <input
                type="text"
                value={remittanceNotes}
                onChange={(e) => setRemittanceNotes(e.target.value)}
                placeholder="e.g. Bank credit verified via Faysal Bank statement"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </AdminModal>
      )}

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
