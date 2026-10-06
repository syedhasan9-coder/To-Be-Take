'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AdminProductItem,
  AdminProductStatus,
  AdminProductModerationStatus,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

export default function AdminProductsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminProductItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [moderationFilter, setModerationFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Moderation modal state
  const [moderationProduct, setModerationProduct] = useState<AdminProductItem | null>(null);
  const [targetModerationStatus, setTargetModerationStatus] =
    useState<AdminProductModerationStatus>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (moderationFilter) params.set('moderationStatus', moderationFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showToast('error', 'Failed to load products list.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, moderationFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleToggleProductStatus = async (product: AdminProductItem) => {
    const nextStatus: AdminProductStatus =
      product.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    try {
      const res = await adminFetch(`/api/admin/products/${product.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update status');
      showToast('success', `Product status set to ${nextStatus}`);
      fetchProducts();
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  const handleModerate = async () => {
    if (!moderationProduct) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/products/${moderationProduct.id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationStatus: targetModerationStatus,
          rejectionReason:
            targetModerationStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Moderation action failed');
      showToast(
        'success',
        `Product '${moderationProduct.title}' moderation status set to ${targetModerationStatus}`,
      );
      setModerationProduct(null);
      setRejectionReason('');
      fetchProducts();
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
          <div className="admin-welcome-tag">Catalog Governance</div>
          <h1 className="admin-welcome-title">Product Catalog &amp; Moderation</h1>
          <p className="admin-welcome-desc">
            Supervise vendor offerings across all departments, review listings for marketplace
            compliance, manage SKUs, pricing, and stock visibility.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
              placeholder="Search products by title, SKU, description..."
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
              <option value="">All Catalog Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={moderationFilter}
              onChange={(e) => {
                setModerationFilter(e.target.value);
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
              <option value="">All Moderation</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Moderation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading products...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      No products found in the catalog matching criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div>
                        <Link
                          href={`/admin/products/${prod.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--color-forest-800)',
                            textDecoration: 'underline',
                          }}
                        >
                          {prod.title}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          SKU: {prod.sku || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prod.storeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {prod.sellerName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {prod.categoryName || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{formatPrice(prod.price)}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            prod.stockQuantity <= 5
                              ? prod.stockQuantity === 0
                                ? 'var(--error-text)'
                                : '#854d0e'
                              : 'var(--text-primary)',
                        }}
                      >
                        {prod.stockQuantity}
                      </span>
                    </td>
                    <td>
                      <AdminBadge status={prod.status} />
                    </td>
                    <td>
                      <AdminBadge status={prod.moderationStatus || 'APPROVED'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          href={`/admin/products/${prod.id}`}
                          className="admin-banner-action-btn"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-forest-800)',
                            background: 'var(--bg-cream)',
                            borderColor: 'var(--border-medium)',
                          }}
                        >
                          Detail
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setModerationProduct(prod);
                            setTargetModerationStatus(
                              prod.moderationStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED',
                            );
                            setRejectionReason('');
                          }}
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            background:
                              prod.moderationStatus === 'APPROVED'
                                ? 'var(--error-bg)'
                                : 'var(--success-bg)',
                            color:
                              prod.moderationStatus === 'APPROVED'
                                ? 'var(--error-text)'
                                : 'var(--success-text)',
                            border: '1px solid transparent',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {prod.moderationStatus === 'APPROVED' ? 'Reject' : 'Approve'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(prod)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'var(--bg-cream)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          {prod.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        </button>
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
              Showing {data.items.length} of {data.total} products (Page {data.page} of{' '}
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

      {/* Moderation Modal */}
      {moderationProduct && (
        <AdminModal
          isOpen={true}
          title={`Moderate Product: ${moderationProduct.title}`}
          onClose={() => setModerationProduct(null)}
          onConfirm={handleModerate}
          confirmLabel={
            isSubmitting
              ? 'Saving...'
              : targetModerationStatus === 'APPROVED'
                ? 'Approve Listing'
                : 'Reject Listing'
          }
          confirmVariant={targetModerationStatus === 'APPROVED' ? 'primary' : 'danger'}
          isSubmitting={isSubmitting}
        >
          <div>
            <p
              style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}
            >
              Vendor Store: <strong>{moderationProduct.storeName}</strong> (
              {moderationProduct.sellerName})
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Decision
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="modStatus"
                    value="APPROVED"
                    checked={targetModerationStatus === 'APPROVED'}
                    onChange={() => setTargetModerationStatus('APPROVED')}
                  />
                  <span>Approve</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="modStatus"
                    value="REJECTED"
                    checked={targetModerationStatus === 'REJECTED'}
                    onChange={() => setTargetModerationStatus('REJECTED')}
                  />
                  <span>Reject</span>
                </label>
              </div>
            </div>

            {targetModerationStatus === 'REJECTED' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide clear reasons for rejection (e.g. Prohibited items, incorrect image specs)..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
