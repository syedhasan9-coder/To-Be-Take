'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { customerApi } from '../../../../lib/customer-api';
import { CustomerReviewItem } from '@tobetake/shared-types';

export default function AccountReviewsPage(): React.ReactElement {
  const [reviews, setReviews] = useState<CustomerReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await customerApi.getReviews();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.75rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          My Product Reviews
        </h1>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Reviews and feedback you have submitted for purchased products.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#526359' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>⭐</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.35rem' }}>
            No reviews submitted yet
          </h3>
          <p style={{ color: '#82948a', fontSize: '0.8125rem' }}>
            When you purchase and review products, your ratings will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                border: '1px solid #f0ebe1',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
              }}
            >
              {r.productImage && (
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f8f5ee', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.productImage} alt={r.productName || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <Link href={`/products/${r.productSlug || r.productId}`} style={{ textDecoration: 'none', color: '#14291f' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                      {r.productName || 'Handcrafted Pakistani Product'}
                    </h3>
                  </Link>
                  <span style={{ fontSize: '0.75rem', color: '#82948a' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ color: '#d4a34b', fontSize: '0.9375rem', margin: '0.25rem 0 0.4rem' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>

                {r.title && <p style={{ fontWeight: 700, color: '#14291f', fontSize: '0.875rem', margin: '0 0 0.25rem' }}>{r.title}</p>}
                <p style={{ color: '#526359', fontSize: '0.8125rem', lineHeight: 1.4, margin: 0 }}>
                  {r.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
