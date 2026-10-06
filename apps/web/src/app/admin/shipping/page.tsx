'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminShipmentItem, AdminShippingStatus, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';

export default function AdminShippingPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminShipmentItem>>({
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

  // Update Tracking Modal
  const [editingShipment, setEditingShipment] = useState<AdminShipmentItem | null>(null);
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [status, setStatus] = useState<AdminShippingStatus>('IN_TRANSIT');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/shipping?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load shipping records:', err);
      showToast('error', 'Failed to load shipments.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const handleConfirmUpdate = async () => {
    if (!editingShipment) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/shipping/${editingShipment.id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: carrier.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          trackingUrl: trackingUrl.trim() || undefined,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update tracking');
      showToast('success', `Shipment tracking for Order #${editingShipment.orderNumber} updated.`);
      setEditingShipment(null);
      fetchShipments();
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
          <div className="admin-welcome-tag">Logistics &amp; Fulfillment</div>
          <h1 className="admin-welcome-title">Shipping &amp; Delivery Tracking</h1>
          <p className="admin-welcome-desc">
            Monitor consignment carrier dispatch, verify cross-dock tracking numbers, audit transit
            timelines, and synchronize parcel delivery statuses.
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
              placeholder="Search by tracking #, order #, carrier..."
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
            <option value="">All Shipping Statuses</option>
            <option value="PENDING">Pending Dispatch</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Delivery Failed</option>
          </select>
        </div>

        {/* Shipping Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Carrier</th>
                <th>Tracking Number</th>
                <th>Status</th>
                <th>Shipped Date</th>
                <th>Delivered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading shipment records...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No shipment records found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((ship) => (
                  <tr key={ship.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${ship.orderId}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-forest-700)',
                          textDecoration: 'underline',
                        }}
                      >
                        {ship.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{ship.carrier || 'Standard Courier'}</span>
                    </td>
                    <td>
                      {ship.trackingNumber ? (
                        <code
                          style={{
                            fontSize: '0.82rem',
                            background: 'var(--bg-cream)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                          }}
                        >
                          {ship.trackingNumber}
                        </code>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <AdminBadge status={ship.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ship.shippedAt ? new Date(ship.shippedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ship.deliveredAt ? new Date(ship.deliveredAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShipment(ship);
                          setCarrier(ship.carrier || '');
                          setTrackingNumber(ship.trackingNumber || '');
                          setTrackingUrl(ship.trackingUrl || '');
                          setStatus(ship.status);
                        }}
                        className="admin-banner-action-btn primary"
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        Update
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
              Showing {data.items.length} of {data.total} shipments (Page {data.page} of{' '}
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

      {/* Tracking Modal */}
      {editingShipment && (
        <AdminModal
          isOpen={true}
          title={`Update Shipment: Order #${editingShipment.orderNumber}`}
          onClose={() => setEditingShipment(null)}
          onConfirm={handleConfirmUpdate}
          confirmLabel={isSubmitting ? 'Saving...' : 'Save Tracking Info'}
          confirmVariant="primary"
          isSubmitting={isSubmitting}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Delivery Carrier
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. TCS Express, Leopards Courier, Trax Logistics, Pakistan Post"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
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
                Waybill / Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. TCS-772910482 / LEP-881920"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
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
                Tracking URL (Optional)
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://www.tcsexpress.com/track/..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
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
                Shipment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminShippingStatus)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
