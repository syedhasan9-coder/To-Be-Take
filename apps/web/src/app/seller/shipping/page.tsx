'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShipmentListItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';

export default function SellerShippingPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<ShipmentListItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  // Update shipment modal
  const [editShipment, setEditShipment] = useState<ShipmentListItem | null>(null);
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('IN_TRANSIT');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/shipping?${params.toString()}`);

      if (!res.ok) throw new Error('Failed to load shipments');
      const json = await res.json();
      const payload = json.data || json;
      if (payload && payload.items) {
        setData(payload);
      } else if (Array.isArray(payload)) {
        setData({
          items: payload,
          total: payload.length,
          page: 1,
          limit: payload.length,
          totalPages: 1,
        });
      } else {
        setData(payload);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error fetching shipments');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleOpenEdit = (shipment: ShipmentListItem) => {
    setEditShipment(shipment);
    setCarrier(shipment.carrier || '');
    setTrackingNumber(shipment.trackingNumber || '');
    setTrackingUrl(shipment.trackingUrl || '');
    setStatus(shipment.status);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShipment) return;

    setIsUpdating(true);
    try {
      const res = await sellerFetch(
        `/api/seller/shipping/${editShipment.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            carrier: carrier.trim(),
            trackingNumber: trackingNumber.trim(),
            trackingUrl: trackingUrl.trim() || undefined,
            status,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update shipment');
      }

      showToast('success', `Shipment tracking updated for ${editShipment.orderNumber}`);
      setEditShipment(null);
      fetchShipments();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update shipment tracking');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toasts */}
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

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Logistics &amp; Shipping Tracker
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Manage tracking identifiers, courier dispatches, and delivery status transitions for customer orders.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search tracking #, carrier, or order #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
            }}
          >
            <option value="">All Shipping Statuses</option>
            <option value="LABEL_CREATED">Label Created</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Shipments Tracked: {data.total}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading logistics records...
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No shipments found matching your filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Carrier</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Tracking Number</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Shipped Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Estimated Delivery</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      <Link href={`/seller/orders/${s.orderId}`} style={{ color: '#1b4332', textDecoration: 'none' }}>
                        {s.orderNumber || s.orderId}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155' }}>
                      {s.carrier}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#1e293b' }}>
                      {s.trackingNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            s.status === 'DELIVERED'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : 'rgba(2, 132, 199, 0.1)',
                          color:
                            s.status === 'DELIVERED'
                              ? '#15803d'
                              : '#0284c7',
                        }}
                      >
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {s.shippedDate ? new Date(s.shippedDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="btn-seller"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Update Tracking
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div
            style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              background: '#fcfbf9',
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Page {data.page} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Edit Shipment Modal */}
      {editShipment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1b4332' }}>
                Update Shipment Tracking
              </h3>
              <button
                type="button"
                onClick={() => setEditShipment(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '6px', background: '#faf8f5', marginBottom: '1.25rem', border: '1px solid #e2d9cc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b4332' }}>
                Order #{editShipment.orderNumber}
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                  Courier / Carrier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS, Leopards, Trax, Call Courier, M&P, Pakistan Post"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                  Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS-772910482 / LEP-881920"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                  Shipping Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff' }}
                >
                  <option value="LABEL_CREATED">Label Created</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditShipment(null)}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-seller"
                >
                  {isUpdating ? 'Saving...' : 'Save Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
