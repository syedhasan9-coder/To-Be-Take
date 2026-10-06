'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProductReviewItem, PaginatedResult } from '@tobetake/shared-types';

import { sellerFetch } from '@/lib/api';

export default function SellerReviewsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<ProductReviewItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.set('rating', ratingFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const json = await res.json();
      setData(json.data || json);
    } catch {
      // Suppress
    } finally {
      setIsLoading(false);
    }
  }, [ratingFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Customer Product Reviews
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Real feedback, star ratings, and testimonials submitted by customers for your store&apos;s products.
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
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
            <option value="">All Star Ratings</option>
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Total Reviews: {data.total}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
          Loading product reviews...
        </div>
      ) : data.items.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', color: '#64748b' }}>
            No customer reviews found matching your rating filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {data.items.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1b4332', margin: 0 }}>
                    {r.productName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Reviewed by <strong>{r.customerName}</strong> on {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: '#eab308', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
              </div>

              {r.title && (
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                  {r.title}
                </div>
              )}

              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div
          className="card"
          style={{
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
  );
}
