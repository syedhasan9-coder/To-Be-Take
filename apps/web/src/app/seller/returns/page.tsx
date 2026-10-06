'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { OrderReturnItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerReturnsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<OrderReturnItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/returns?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load returns');
      const json = await res.json();
      setData(json.data || json);
    } catch {
      // Suppress
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Customer Returns &amp; Disputes
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          View return requests, reason codes, product return statuses, and customer refund outcomes.
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search by return #, order #, or reason..."
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
            <option value="">All Return Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="RECEIVED">Received</option>
            <option value="REFUNDED">Refunded</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Total Returns: {data.total}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading return records...
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No customer returns found for your store items.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Return #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Return Reason</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Return Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Refund Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                      {r.returnNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Link
                        href={`/seller/orders/${r.orderId}`}
                        style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {r.orderNumber || r.orderId}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {r.customerName || 'Customer'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', maxWidth: '240px' }}>
                      {r.reason}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            r.status === 'REFUNDED' || r.status === 'APPROVED'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : r.status === 'REJECTED'
                                ? '#fef2f2'
                                : 'rgba(217, 119, 6, 0.1)',
                          color:
                            r.status === 'REFUNDED' || r.status === 'APPROVED'
                              ? '#15803d'
                              : r.status === 'REJECTED'
                                ? '#991b1b'
                                : '#b45309',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: r.refundStatus === 'PAID' || r.refundStatus === 'REFUNDED' ? '#15803d' : '#64748b',
                        }}
                      >
                        {r.refundStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#b91c1c', textAlign: 'right' }}>
                      {formatPKR(r.refundAmount)}
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
