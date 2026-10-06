'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SellerDashboardData } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR, formatPrice } from '@/lib/currency';

export default function SellerDashboardPage(): React.ReactElement {
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sellerFetch('/api/seller/dashboard');

      if (!res.ok) {
        throw new Error(`Failed to load seller dashboard (${res.status})`);
      }

      const json = await res.json();
      const payload = json.data || json;
      if (payload && payload.kpis) {
        setData(payload);
      } else {
        throw new Error(json.message || 'Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to seller API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', height: '40px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ height: '110px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ color: '#dc2626', fontSize: '2rem', marginBottom: '1rem' }}>⚠</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1b4332' }}>
            Failed to Load Dashboard
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="btn-seller"
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { kpis, recentOrders, topProducts, lowStockAlerts, recentReviews } = data;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-forest-900, #0d1f18)',
              marginBottom: '0.25rem',
            }}
          >
            Merchant Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #718096)' }}>
            Monitor real-time sales, order fulfillment, catalog health, and payout settlement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href="/seller/products/new"
            className="btn-seller"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            <span>+</span> Add Product
          </Link>
          <Link
            href="/seller/inventory"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Adjust Stock
          </Link>
          <Link
            href="/seller/orders"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            Fulfill Orders
          </Link>
        </div>
      </div>

      {/* 8 Primary Commerce KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Gross Sales */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Gross Sales Volume
            </span>
            <span style={{ color: '#2d6a4f', fontSize: '1.1rem' }}>💵</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
            {formatPKR(kpis.totalSales)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Total item value across all orders
          </div>
        </div>

        {/* Net Seller Earnings */}
        <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fbfaf8, #f5f1e8)', borderColor: 'var(--color-gold-300, #d4a373)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.05em' }}>
              Net Merchant Earnings
            </span>
            <span style={{ color: '#b45309', fontSize: '1.1rem' }}>📈</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92400e', marginBottom: '0.25rem' }}>
            {formatPKR(kpis.netSales)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
            After platform fee deductions ({formatPKR(kpis.totalPlatformFees)})
          </div>
        </div>

        {/* Total Orders */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Total Orders
            </span>
            <span style={{ color: '#0284c7', fontSize: '1.1rem' }}>📦</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1', marginBottom: '0.25rem' }}>
            {kpis.totalOrders ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Avg Order: {formatPKR(kpis.averageOrderValue)}
          </div>
        </div>

        {/* Pending / Processing */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Requires Fulfillment
            </span>
            <span style={{ color: '#d97706', fontSize: '1.1rem' }}>⏳</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', marginBottom: '0.25rem' }}>
            {(kpis.pendingOrders ?? 0) + (kpis.processingOrders ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {kpis.pendingOrders ?? 0} pending, {kpis.processingOrders ?? 0} in process
          </div>
        </div>

        {/* Shipped / Delivered */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Fulfilled Deliveries
            </span>
            <span style={{ color: '#16a34a', fontSize: '1.1rem' }}>🚚</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginBottom: '0.25rem' }}>
            {kpis.deliveredOrders ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {kpis.shippedOrders ?? 0} currently in transit
          </div>
        </div>

        {/* Active Products */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Active Catalog Items
            </span>
            <span style={{ color: '#6366f1', fontSize: '1.1rem' }}>🏷</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginBottom: '0.25rem' }}>
            {kpis.activeProducts ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Live on marketplace storefront
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: (kpis.lowStockProducts ?? 0) > 0 ? '#fffbeb' : '#ffffff',
            borderColor: (kpis.lowStockProducts ?? 0) > 0 ? '#fde68a' : 'inherit',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: (kpis.lowStockProducts ?? 0) > 0 ? '#b45309' : '#64748b', letterSpacing: '0.05em' }}>
              Low Stock Alerts
            </span>
            <span style={{ color: '#eab308', fontSize: '1.1rem' }}>⚠</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (kpis.lowStockProducts ?? 0) > 0 ? '#b45309' : '#1e293b', marginBottom: '0.25rem' }}>
            {kpis.lowStockProducts ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: (kpis.lowStockProducts ?? 0) > 0 ? '#b45309' : '#64748b' }}>
            {kpis.outOfStockProducts ?? 0} items out of stock
          </div>
        </div>

        {/* Pending Payout */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Paid Disbursements
            </span>
            <span style={{ color: '#059669', fontSize: '1.1rem' }}>🏛</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857', marginBottom: '0.25rem' }}>
            {formatPKR(kpis.totalPaidPayouts)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Pending in settlement: {formatPKR(kpis.pendingPayout)}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Orders Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.2rem' }}>
                Recent Store Orders
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest customer purchases of your items</p>
            </div>
            <Link
              href="/seller/orders"
              style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-forest-700, #2d6a4f)', textDecoration: 'none' }}
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              <p>No customer orders placed yet for your items.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Order #</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Items</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Subtotal</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>
                        <Link
                          href={`/seller/orders/${o.id}`}
                          style={{ color: '#1b4332', textDecoration: 'none' }}
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#334155' }}>
                        {o.customerName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                        {o.itemCount}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#1b4332' }}>
                        {formatPKR(o.total)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          className={`badge-${o.status.toLowerCase()}`}
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.2rem' }}>
                Top Performing Products
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Highest velocity items in your catalog</p>
            </div>
            <Link
              href="/seller/products"
              style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-forest-700, #2d6a4f)', textDecoration: 'none' }}
            >
              Manage Catalog →
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              <p>No products cataloged yet.</p>
              <Link href="/seller/products/new" className="btn-seller" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                Create First Product
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#fcfbf9',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b4332' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      SKU: {p.sku} • Stock: {p.stockQuantity}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1b4332' }}>
                      {formatPrice(p.price)}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: p.status === 'ACTIVE' ? '#16a34a' : '#64748b',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Grid: Low Stock Alerts & Recent Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Alerts */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.2rem' }}>
                Stock Replenishment Alerts
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Items at or below critical threshold</p>
            </div>
            <Link
              href="/seller/inventory"
              style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-forest-700, #2d6a4f)', textDecoration: 'none' }}
            >
              Inventory Hub →
            </Link>
          </div>

          {lowStockAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#16a34a', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600 }}>✓ All catalog items have healthy stock levels.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: item.stockQuantity === 0 ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${item.stockQuantity === 0 ? '#fecaca' : '#fde68a'}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: item.stockQuantity === 0 ? '#991b1b' : '#92400e' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      SKU: {item.sku} • Threshold: {item.lowStockThreshold}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        background: item.stockQuantity === 0 ? '#dc2626' : '#d97706',
                        color: '#ffffff',
                      }}
                    >
                      {item.stockQuantity} in stock
                    </span>
                    <Link
                      href="/seller/inventory"
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.2rem' }}>
                Customer Feedback
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest reviews on your products</p>
            </div>
            <Link
              href="/seller/reviews"
              style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-forest-700, #2d6a4f)', textDecoration: 'none' }}
            >
              All Reviews →
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              <p>No reviews received yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentReviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#fcfbf9',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1b4332' }}>
                      {r.productName}
                    </span>
                    <span style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 700 }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#334155', margin: '0.25rem 0', fontStyle: 'italic' }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    By {r.customerName} on {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
