'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CommissionRecordItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerCommissionsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<CommissionRecordItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const fetchCommissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sellerFetch(`/api/seller/finance/commissions?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to load commissions');
      const json = await res.json();
      setData(json.data || json);
    } catch {
      // Suppress
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Marketplace Commissions Ledger
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Transparent view of platform commissions applied to your store&apos;s fulfilled orders.
        </p>
      </div>

      {/* Governance Notice */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          background: '#faf8f5',
          borderColor: '#e2d9cc',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
        <span style={{ fontSize: '0.85rem', color: '#78350f' }}>
          Platform commission rates are governed system-wide. Rates are applied automatically per completed customer purchase.
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading commission records...
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No commission records available.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order Gross Value</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Commission Rate</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Platform Fee</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Your Earning</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      <Link href={`/seller/orders/${c.orderId}`} style={{ color: '#1b4332', textDecoration: 'none' }}>
                        {c.orderNumber || c.orderId}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                      {formatPKR(c.orderAmount)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {Number(c.commissionRate)}%
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#b91c1c' }}>
                      -{formatPKR(c.platformFee)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#15803d', textAlign: 'right' }}>
                      {formatPKR(c.sellerEarnings)}
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
    </div>
  );
}
