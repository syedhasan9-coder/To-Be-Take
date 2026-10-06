'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AdminProductDetail,
  AdminProductModerationStatus,
  AdminProductStatus,
} from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

export default function AdminProductDetailPage(): React.ReactElement {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Moderation state
  const [showModModal, setShowModModal] = useState<boolean>(false);
  const [modStatus, setModStatus] = useState<AdminProductModerationStatus>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchProductDetail = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProduct(json.data);
      }
    } catch (err) {
      console.error('Failed to load product detail:', err);
      showToast('error', 'Failed to load product detail.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handleModerate = async () => {
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/products/${productId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationStatus: modStatus,
          rejectionReason: modStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to moderate product');
      showToast('success', `Product moderation status updated to ${modStatus}`);
      setShowModModal(false);
      setRejectionReason('');
      fetchProductDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetStatus: AdminProductStatus) => {
    try {
      const res = await adminFetch(`/api/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update status');
      showToast('success', `Product status set to ${targetStatus}`);
      fetchProductDetail();
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          The requested product does not exist or has been removed.
        </p>
        <Link href="/admin/products" className="admin-banner-action-btn primary">
          ← Back to Catalog
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
            href="/admin/products"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-cream)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            ← Back to Products
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{product.title}</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              SKU: {product.sku || 'N/A'} • Created on{' '}
              {new Date(product.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AdminBadge status={product.status} />
          <AdminBadge status={product.moderationStatus || 'APPROVED'} />
          <button
            type="button"
            onClick={() => {
              setModStatus(product.moderationStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED');
              setShowModModal(true);
            }}
            className="admin-banner-action-btn primary"
            style={{ padding: '0.45rem 1rem' }}
          >
            Moderate Listing
          </button>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="admin-dash-grid">
        {/* Left Column: Product Information & Media */}
        <div>
          <div className="admin-dash-card" style={{ marginBottom: '1.5rem' }}>
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Product Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                  Description
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {product.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}
                  >
                    Listing Price
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {formatPrice(product.price)}
                  </span>
                </div>
                <div>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}
                  >
                    Compare At Price
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    {product.compareAtPrice ? formatPrice(product.compareAtPrice) : '—'}
                  </span>
                </div>
                <div>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}
                  >
                    Cost Price
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    {product.costPrice ? formatPrice(product.costPrice) : '—'}
                  </span>
                </div>
              </div>

              {product.images && product.images.length > 0 && (
                <div>
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Product Gallery ({product.images.length})
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {product.images.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-cream)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Product media ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Moderation History */}
          {product.rejectionReason && (
            <div className="admin-dash-card">
              <div className="admin-dash-card-header">
                <span className="admin-dash-card-title" style={{ color: 'var(--error-text)' }}>
                  Moderation Feedback
                </span>
              </div>
              <p style={{ color: 'var(--error-text)', fontSize: '0.88rem' }}>
                {product.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Inventory, Seller Ownership, Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Inventory Overview Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Inventory Status</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Available Stock:
                </span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {product.inventory?.availableStock ?? product.stockQuantity}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Reserved Stock:
                </span>
                <span style={{ fontWeight: 600 }}>{product.inventory?.reservedStock ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Low Stock Threshold:
                </span>
                <span>{product.inventory?.lowStockThreshold ?? 5}</span>
              </div>
              <Link
                href="/admin/inventory"
                style={{
                  color: 'var(--color-forest-700)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  marginTop: '0.25rem',
                }}
              >
                Manage in Central Inventory →
              </Link>
            </div>
          </div>

          {/* Seller Ownership Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Vendor Store</span>
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
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                  Store
                </span>
                <span style={{ fontWeight: 600 }}>{product.storeName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                  Vendor Name
                </span>
                <span>{product.sellerName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                  Vendor Email
                </span>
                <span>{product.sellerEmail}</span>
              </div>
            </div>
          </div>

          {/* Category Card */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Category Placement</span>
            </div>
            <div style={{ fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                Primary Category
              </span>
              <span style={{ fontWeight: 600 }}>{product.categoryName || 'Uncategorized'}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <span className="admin-dash-card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('PUBLISHED')}
                  className="admin-banner-action-btn primary"
                  style={{ justifyContent: 'center' }}
                >
                  Publish to Marketplace
                </button>
              )}
              {product.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('ARCHIVED')}
                  className="admin-banner-action-btn"
                  style={{
                    justifyContent: 'center',
                    borderColor: 'var(--border-medium)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Archive Listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Modal */}
      {showModModal && (
        <AdminModal
          isOpen={true}
          title={`Moderate Product: ${product.title}`}
          onClose={() => setShowModModal(false)}
          onConfirm={handleModerate}
          confirmLabel={
            isSubmitting
              ? 'Saving...'
              : modStatus === 'APPROVED'
                ? 'Approve Listing'
                : 'Reject Listing'
          }
          confirmVariant={modStatus === 'APPROVED' ? 'primary' : 'danger'}
          isSubmitting={isSubmitting}
        >
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Moderation Status
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
                    name="modalModStatus"
                    value="APPROVED"
                    checked={modStatus === 'APPROVED'}
                    onChange={() => setModStatus('APPROVED')}
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
                    name="modalModStatus"
                    value="REJECTED"
                    checked={modStatus === 'REJECTED'}
                    onChange={() => setModStatus('REJECTED')}
                  />
                  <span>Reject</span>
                </label>
              </div>
            </div>

            {modStatus === 'REJECTED' && (
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
                  placeholder="Explain why this listing is rejected..."
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
