'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SellerPayoutItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerPayoutsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<SellerPayoutItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sellerFetch(`/api/seller/finance/payouts?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to load payouts');
      const json = await res.json();
      setData(json.data || json);
    } catch {
      // Suppress
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Merchant Disbursements &amp; Payouts
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          History of disbursed earnings transfers and settlements directly to your banking account.
        </p>
      </div>

      {/* Info Notice */}
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
        <span style={{ fontSize: '1.25rem' }}>🏛</span>
        <span style={{ fontSize: '0.85rem', color: '#78350f' }}>
          Marketplace disbursements are reviewed and disbursed according to platform settlement schedules.
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading payout records...
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No payout disbursements recorded yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Payout #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Settlement Period</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Disbursed Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                      {p.payoutNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                      {formatPKR(p.amount)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: p.status === 'PAID' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                          color: p.status === 'PAID' ? '#15803d' : '#b45309',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {p.periodStart ? `${new Date(p.periodStart).toLocaleDateString()} — ${p.periodEnd ? new Date(p.periodEnd).toLocaleDateString() : 'Present'}` : 'All-time'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : 'Pending Processing'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem', textAlign: 'right' }}>
                      {p.notes || 'Direct Bank Settlement'}
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
