'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ProductListItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

export default function SellerProductsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<ProductListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const [deleteProductItem, setDeleteProductItem] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/products?${params.toString()}`);

      if (!res.ok) throw new Error('Failed to fetch products');
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
      showToast('error', err.message || 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStatus = async (product: ProductListItem) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

      const res = await sellerFetch(`/api/seller/products/${product.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update product status');
      showToast('success', `Product status set to ${newStatus}`);
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Error updating product');
    }
  };

  const handleDelete = async () => {
    if (!deleteProductItem) return;
    setIsDeleting(true);
    try {
      const res = await sellerFetch(`/api/seller/products/${deleteProductItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove product');
      showToast('success', 'Product removed from store catalog');
      setDeleteProductItem(null);
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Error removing product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast notifications */}
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
            Store Catalog &amp; Products
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Manage pricing, catalog listings, and inventory availability for your marketplace storefront.
          </p>
        </div>

        <Link
          href="/seller/products/new"
          className="btn-seller"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.25rem',
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          <span>+</span> Add New Product
        </Link>
      </div>

      {/* Filter / Search Bar */}
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
            placeholder="Search by product name or SKU..."
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
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Total Catalog Items: {data?.total || 0}
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading catalog...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '1rem' }}>
              No products found matching your filter criteria.
            </p>
            <Link href="/seller/products/new" className="btn-seller">
              Add Your First Product →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Product / SKU</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Price</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Stock</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => {
                  const isLow = product.stockQuantity <= (product.inventory?.lowStockThreshold || 5);
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#1b4332' }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          SKU: {product.sku}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {product.categoryName || 'Uncategorized'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                        {formatPrice(product.price)}
                        {product.compareAtPrice && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.35rem' }}>
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: product.stockQuantity === 0 ? '#dc2626' : isLow ? '#d97706' : '#15803d',
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: product.stockQuantity === 0 ? '#dc2626' : isLow ? '#d97706' : '#15803d',
                            }}
                          />
                          {product.stockQuantity} units
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: product.status === 'ACTIVE' ? 'rgba(22, 163, 74, 0.1)' : '#f1f5f9',
                            color: product.status === 'ACTIVE' ? '#15803d' : '#64748b',
                          }}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/seller/products/${product.id}/edit`}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none' }}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteProductItem(product)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
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

      {/* Delete Confirmation Modal */}
      {deleteProductItem && (
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
              Remove Product From Store?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{deleteProductItem.name}</strong> (SKU: {deleteProductItem.sku})? This product will no longer appear on the marketplace.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteProductItem(null)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isDeleting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
