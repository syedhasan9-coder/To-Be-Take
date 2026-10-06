'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { OrderListItem, PaginatedResult } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerOrdersPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<OrderListItem>>({
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await sellerFetch(`/api/seller/orders?${params.toString()}`);

      if (!res.ok) throw new Error('Failed to load orders');
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
      setErrorMessage(err.message || 'Error loading store orders');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Customer Orders &amp; Fulfillment
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Track orders containing your items, update shipment logistics, and manage fulfillment status.
        </p>
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
            placeholder="Search by order number or customer name..."
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
            <option value="">All Fulfillment Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Orders Found: {data.total}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
            Loading store orders...
          </div>
        ) : errorMessage ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
            <p>{errorMessage}</p>
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#64748b' }}>
              No orders found matching your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e2d9cc', color: '#1b4332', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Your Items</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Your Subtotal</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      <Link
                        href={`/seller/orders/${order.id}`}
                        style={{ color: '#1b4332', textDecoration: 'none' }}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {order.itemCount} item(s)
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                      {formatPKR(order.total)}
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
                            order.status === 'DELIVERED'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : order.status === 'CANCELLED'
                                ? '#fef2f2'
                                : 'rgba(217, 119, 6, 0.1)',
                          color:
                            order.status === 'DELIVERED'
                              ? '#15803d'
                              : order.status === 'CANCELLED'
                                ? '#991b1b'
                                : '#b45309',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: order.paymentStatus === 'PAID' ? '#15803d' : '#64748b',
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="btn-seller"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        Fulfill / View →
                      </Link>
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
