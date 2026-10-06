'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminReviewItem, AdminReviewStatus, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';

export default function AdminReviewsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminReviewItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Moderation Modal
  const [modReview, setModReview] = useState<AdminReviewItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<AdminReviewStatus>('PUBLISHED');
  const [isFlagged, setIsFlagged] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (flaggedOnly) params.set('isFlagged', 'true');
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      showToast('error', 'Failed to load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, flaggedOnly, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleConfirmModerate = async () => {
    if (!modReview) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/reviews/${modReview.id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          isFlagged,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to moderate review');
      showToast('success', `Review status updated to ${targetStatus}.`);
      setModReview(null);
      fetchReviews();
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
          <div className="admin-welcome-tag">Trust &amp; Community Integrity</div>
          <h1 className="admin-welcome-title">Product Reviews &amp; Moderation</h1>
          <p className="admin-welcome-desc">
            Safeguard customer trust, moderate product feedback, investigate community-flagged
            ratings, and suppress abusive or spam testimonials.
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
              placeholder="Search by review text, product, author..."
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <option value="">All Review Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="FLAGGED">Flagged</option>
              <option value="HIDDEN">Hidden</option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: flaggedOnly ? 'rgba(212, 163, 75, 0.15)' : 'var(--bg-cream)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(e) => {
                  setFlaggedOnly(e.target.checked);
                  setPage(1);
                }}
              />
              <span>🚩 Flagged Only</span>
            </label>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Seller Store</th>
                <th>Rating</th>
                <th>Review Content</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading reviews...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No reviews found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <Link
                        href={`/admin/products/${rev.productId}`}
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-forest-800)',
                          textDecoration: 'underline',
                        }}
                      >
                        {rev.productTitle}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rev.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rev.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{rev.storeName}</span>
                    </td>
                    <td>
                      <div style={{ color: '#d4af37', fontWeight: 700 }}>
                        {'★'.repeat(rev.rating)}
                        <span style={{ color: 'var(--border-medium)' }}>
                          {'★'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '260px' }}>
                        {rev.title && (
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{rev.title}</div>
                        )}
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {rev.content}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <AdminBadge status={rev.status} />
                        {rev.isFlagged && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--error-text)',
                              fontWeight: 700,
                            }}
                          >
                            FLAGGED
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setModReview(rev);
                          setTargetStatus(rev.status);
                          setIsFlagged(Boolean(rev.isFlagged || rev.isReported));
                          setAdminNotes(rev.adminNotes || '');
                        }}
                        className="admin-banner-action-btn primary"
                        style={{
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        Moderate
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
              Showing {data.items.length} of {data.total} reviews (Page {data.page} of{' '}
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
      {modReview && (
        <AdminModal
          isOpen={true}
          title={`Moderate Review for "${modReview.productTitle}"`}
          onClose={() => setModReview(null)}
          onConfirm={handleConfirmModerate}
          confirmLabel={isSubmitting ? 'Saving...' : 'Apply Moderation'}
          confirmVariant={targetStatus === 'HIDDEN' ? 'danger' : 'primary'}
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
                Author: <strong>{modReview.customerName}</strong> ({modReview.customerEmail})
              </div>
              <div>
                Rating: <strong>{modReview.rating} / 5</strong>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <em>&ldquo;{modReview.content}&rdquo;</em>
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
                Visibility Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AdminReviewStatus)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="PUBLISHED">PUBLISHED (Visible to all shoppers)</option>
                <option value="HIDDEN">HIDDEN (Suppressed from catalog)</option>
                <option value="FLAGGED">FLAGGED (Under investigation)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="isFlaggedCheck"
                checked={isFlagged}
                onChange={(e) => setIsFlagged(e.target.checked)}
              />
              <label htmlFor="isFlaggedCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                Flagged for community violation review
              </label>
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
                Admin Moderation Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reasoning for moderation action..."
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
