'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { InventoryItemDto, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';

export default function SellerInventoryPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<InventoryItemDto>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  // Adjust stock modal state
  const [adjustItem, setAdjustItem] = useState<InventoryItemDto | null>(null);
  const [stockDelta, setStockDelta] = useState<string>('0');
  const [reason, setReason] = useState<string>('RESTOCK');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (lowStockOnly) params.set('lowStockOnly', 'true');
      if (outOfStockOnly) params.set('outOfStockOnly', 'true');
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/inventory?${params.toString()}`);

      if (!res.ok) throw new Error('Failed to load inventory records');
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
      showToast('error', err.message || 'Error fetching inventory');
    } finally {
      setIsLoading(false);
    }
  }, [search, lowStockOnly, outOfStockOnly, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjust = (item: InventoryItemDto) => {
    setAdjustItem(item);
    setStockDelta('0');
    setReason('RESTOCK');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    const delta = parseInt(stockDelta, 10);
    if (isNaN(delta)) {
      showToast('error', 'Please enter a valid stock delta.');
      return;
    }

    const currentStock = adjustItem.stockQuantity;
    const targetStock = currentStock + delta;

    if (targetStock < 0) {
      showToast('error', `Adjustment would result in negative stock (${targetStock}). Minimum is 0.`);
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const res = await sellerFetch(
        `/api/seller/inventory/${adjustItem.productId}/stock`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            stockQuantity: targetStock,
            changeType: reason,
            reason: reason,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to adjust inventory stock.');
      }

      showToast('success', `Stock updated for ${adjustItem.productName} (New Stock: ${targetStock})`);
      setAdjustItem(null);
      fetchInventory();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating stock.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
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

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Inventory &amp; Stock Workspace
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Monitor stock levels, reserved quantities, replenishment thresholds, and record stock mutations.
        </p>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by SKU or product name..."
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

          <button
            type="button"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className={lowStockOnly ? 'btn-seller' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
          >
            {lowStockOnly ? '✓ Low Stock Filter On' : 'Filter Low Stock'}
          </button>

          <button
            type="button"
            onClick={() => {
              setOutOfStockOnly(!outOfStockOnly);
              setPage(1);
            }}
            className={outOfStockOnly ? 'btn-seller' : 'btn-secondary'}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
          >
            {outOfStockOnly ? '✓ Out of Stock On' : 'Filter Out of Stock'}
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Items Tracked: {data.total}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading stock levels...
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No inventory records found matching your filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>SKU / Product</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Current Stock</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Reserved</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Available</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Low Threshold</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1b4332' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {item.sku}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontSize: '0.95rem', color: '#1b4332' }}>
                      {item.stockQuantity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {item.reservedQuantity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: item.availableQuantity > 0 ? '#15803d' : '#dc2626' }}>
                      {item.availableQuantity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {item.lowStockThreshold} units
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            item.stockQuantity === 0
                              ? '#fef2f2'
                              : item.isLowStock
                                ? '#fffbeb'
                                : 'rgba(22, 163, 74, 0.1)',
                          color:
                            item.stockQuantity === 0
                              ? '#991b1b'
                              : item.isLowStock
                                ? '#92400e'
                                : '#15803d',
                        }}
                      >
                        {item.stockQuantity === 0
                          ? 'Out of Stock'
                          : item.isLowStock
                            ? 'Low Stock'
                            : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {item.location || 'Warehouse'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item)}
                        className="btn-seller"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Adjust Stock
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

      {/* Adjust Stock Modal */}
      {adjustItem && (
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
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1b4332' }}>
                Adjust Stock Quantity
              </h3>
              <button
                type="button"
                onClick={() => setAdjustItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '6px', background: '#faf8f5', marginBottom: '1.25rem', border: '1px solid #e2d9cc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b4332' }}>{adjustItem.productName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {adjustItem.sku}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2d6a4f', marginTop: '0.25rem' }}>
                Current Stock: {adjustItem.stockQuantity} units
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                  Stock Adjustment (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Resulting Stock:{' '}
                  <strong>{Math.max(0, adjustItem.stockQuantity + (parseInt(stockDelta, 10) || 0))}</strong> units
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                  Adjustment Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                >
                  <option value="RESTOCK">Supplier Restock / Delivery</option>
                  <option value="DAMAGE">Damaged / Expired Inventory</option>
                  <option value="RETURN">Customer Return Restock</option>
                  <option value="CORRECTION">Manual Inventory Count Correction</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="btn-secondary"
                  disabled={isSubmittingAdjust}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="btn-seller"
                >
                  {isSubmittingAdjust ? 'Updating...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
