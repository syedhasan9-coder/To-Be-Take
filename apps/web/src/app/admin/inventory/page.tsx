'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminInventoryItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';

export default function AdminInventoryPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminInventoryItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<AdminInventoryItem | null>(null);
  const [quantityDelta, setQuantityDelta] = useState<number>(0);
  const [reason, setReason] = useState<string>('RESTOCK');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (lowStockOnly) params.set('lowStock', 'true');
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      showToast('error', 'Failed to load inventory list.');
    } finally {
      setIsLoading(false);
    }
  }, [search, lowStockOnly, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const handleConfirmAdjustment = async () => {
    if (!adjustItem) return;
    if (quantityDelta === 0) {
      showToast('error', 'Quantity change must be non-zero.');
      return;
    }
    const currentStock = adjustItem.stockQuantity ?? (adjustItem as any).currentStock ?? 0;
    const targetStock = currentStock + quantityDelta;
    if (targetStock < 0) {
      showToast('error', 'Resulting stock level cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/inventory/${adjustItem.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockQuantity: targetStock,
          changeType: reason,
          reason: notes.trim() ? `${reason}: ${notes.trim()}` : reason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to adjust stock level');
      showToast(
        'success',
        `Stock for '${adjustItem.productName || (adjustItem as any).productTitle}' updated to ${targetStock} units.`,
      );
      setAdjustItem(null);
      setQuantityDelta(0);
      setNotes('');
      fetchInventory();
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
          <div className="admin-welcome-tag">Warehouse &amp; Supply Control</div>
          <h1 className="admin-welcome-title">Inventory Management</h1>
          <p className="admin-welcome-desc">
            Track real-time SKU stock levels, reserved units in pending checkouts, available units,
            and replenish supplies with full audit traceability.
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
              placeholder="Search by SKU, barcode, product title..."
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: lowStockOnly ? 'rgba(212, 163, 75, 0.15)' : 'var(--bg-cream)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(1);
                }}
              />
              <span>⚠️ Low Stock Only</span>
            </label>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product &amp; SKU</th>
                <th>Seller Store</th>
                <th>Current Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading inventory data...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No inventory records found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <Link
                          href={`/admin/products/${item.productId}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--color-forest-800)',
                            textDecoration: 'underline',
                          }}
                        >
                          {item.productTitle}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          SKU: {item.sku}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.storeName}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {item.currentStock ?? item.stockQuantity}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {item.reservedStock ?? item.reservedQuantity ?? 0}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const available =
                          item.availableStock ?? item.availableQuantity ?? item.stockQuantity;
                        return (
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '1rem',
                              color:
                                available <= item.lowStockThreshold
                                  ? available === 0
                                    ? 'var(--error-text)'
                                    : '#854d0e'
                                  : 'var(--color-forest-900)',
                            }}
                          >
                            {available}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.lowStockThreshold}
                      </span>
                    </td>
                    <td>
                      <AdminBadge
                        status={
                          item.status ||
                          (item.isOutOfStock
                            ? 'OUT_OF_STOCK'
                            : item.isLowStock
                              ? 'LOW_STOCK'
                              : 'ACTIVE')
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustItem(item);
                          setQuantityDelta(0);
                          setNotes('');
                        }}
                        className="admin-banner-action-btn primary"
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        Adjust Stock
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
              Showing {data.items.length} of {data.total} records (Page {data.page} of{' '}
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

      {/* Stock Adjustment Modal */}
      {adjustItem && (
        <AdminModal
          isOpen={true}
          title={`Stock Adjustment: ${adjustItem.productTitle}`}
          onClose={() => setAdjustItem(null)}
          onConfirm={handleConfirmAdjustment}
          confirmLabel={isSubmitting ? 'Saving...' : 'Apply Stock Change'}
          confirmVariant="primary"
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
                SKU: <strong>{adjustItem.sku}</strong>
              </div>
              <div>
                Current Available: <strong>{adjustItem.availableStock}</strong> units
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
                Quantity Change (+ to restock, - to deduct) *
              </label>
              <input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
              <div
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                New Stock will be:{' '}
                <strong>
                  {Math.max(0, (adjustItem.stockQuantity ?? (adjustItem as any).currentStock ?? 0) + quantityDelta)}
                </strong>
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
                Reason for Adjustment
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="RESTOCK">Restock / Inventory Delivery</option>
                <option value="CORRECTION">Inventory Audit Correction</option>
                <option value="DAMAGED">Damaged / Expired Goods</option>
                <option value="RETURN">Customer Return Restock</option>
                <option value="OTHER">Other Administrative Reason</option>
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
                Audit Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reference purchase order or inventory count ticket..."
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
