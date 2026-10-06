'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SuperAdminDashboardData } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminGrowthChart } from '@/components/admin/AdminGrowthChart';
import { AdminKpiCard } from '@/components/admin/AdminKpiCard';
import { adminFetch } from '@/lib/api';

export default function AdminDashboardPage(): React.ReactElement {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    roleCode?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tobetake_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Storage read error
    }
  }, []);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await adminFetch('/api/admin/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to load dashboard metrics (Status: ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Error parsing dashboard response');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span className="spinner" style={{ marginRight: '0.75rem' }} />
        <span>Loading live operational metrics &amp; telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="card"
        style={{ padding: '2.5rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}
      >
        <div
          style={{
            color: 'var(--error-text)',
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Unable to Load Dashboard
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error || 'An unexpected error occurred while fetching operational data.'}
        </p>
        <button type="button" onClick={() => fetchDashboardData()} className="btn-admin">
          Retry Loading Data
        </button>
      </div>
    );
  }

  const isSuperAdmin = (user?.roleCode || 'ADMIN') === 'SPADMIN';

  // Real operational values from API
  const totalCustomers = data.kpis.totalCustomers ?? 0;
  const totalSellers = data.kpis.totalSellers ?? 0;
  const pendingSellerApprovals = data.kpis.pendingSellerApprovals ?? 0;
  const totalProducts = data.kpis.activeProducts ?? data.userDistribution?.total ?? 0;
  const lowStockCount = data.kpis.lowStockCount ?? data.commerceKpis?.lowStockProducts ?? 0;
  const pendingOrders = data.kpis.pendingOrders ?? 0;
  const ordersRequiringAttention = data.kpis.ordersRequiringAttention ?? 0;
  const pendingReturns = data.kpis.pendingReturns ?? 0;

  return (
    <div>
      {/* 1. Welcome & Operational Header Banner */}
      <div className="admin-welcome-banner">
        <div className="admin-welcome-inner">
          <div className="admin-welcome-tag">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
            <span>{isSuperAdmin ? 'Super Admin Command Center' : 'Operational Admin Command Center'}</span>
          </div>
          <h1 className="admin-welcome-title">
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Operational Dashboard'}
          </h1>
          <p className="admin-welcome-desc">
            {isSuperAdmin
              ? 'Centralized executive command center for To Be Take. Monitor live platform telemetry, oversee seller onboarding approvals, configure role access policies, and audit system security in real time.'
              : 'Real-time operational dashboard for To Be Take commerce management. Oversee marketplace customer orders, fulfillments, seller approvals, inventory levels, refunds, reviews moderation, and operational logs.'}
          </p>
        </div>

        <div className="admin-welcome-actions">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="admin-banner-action-btn"
            title="Refresh Live Metrics"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isRefreshing ? 'spinner' : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
          <Link href="/admin/orders" className="admin-banner-action-btn primary">
            <span>Manage Orders →</span>
          </Link>
        </div>
      </div>

      {/* 2. System Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}
        >
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  alert.level === 'critical'
                    ? '#fef2f2'
                    : alert.level === 'warning'
                      ? '#fffbeb'
                      : '#eff6ff',
                border: `1px solid ${
                  alert.level === 'critical'
                    ? '#fecaca'
                    : alert.level === 'warning'
                      ? '#fde68a'
                      : '#bfdbfe'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color:
                        alert.level === 'critical'
                          ? '#991b1b'
                          : alert.level === 'warning'
                            ? '#92400e'
                            : '#1e40af',
                    }}
                  >
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {alert.message}
                  </div>
                </div>
              </div>
              {alert.id === 'alert-pending-sellers' && (
                <Link
                  href="/admin/seller-approvals"
                  className="btn-admin"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Review Approvals →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Operational KPI Cards */}
      <div className="admin-kpi-grid">
        <AdminKpiCard
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
          subtext="Registered buyers on platform"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Total Sellers"
          value={totalSellers.toLocaleString()}
          subtext="Active vendor stores"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Pending Seller Approvals"
          value={pendingSellerApprovals.toLocaleString()}
          subtext="Requires verification review"
          trend={
            pendingSellerApprovals > 0
              ? { value: 'Action Required', isPositive: false }
              : { value: 'All Clear', isPositive: true }
          }
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Pending Orders"
          value={pendingOrders.toLocaleString()}
          subtext="Awaiting fulfillment / processing"
          trend={
            pendingOrders > 0
              ? { value: 'Pending', isPositive: false }
              : { value: 'Up to Date', isPositive: true }
          }
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Orders Attention Required"
          value={ordersRequiringAttention.toLocaleString()}
          subtext="Orders needing action"
          trend={
            ordersRequiringAttention > 0
              ? { value: 'Attention', isPositive: false }
              : { value: 'Healthy', isPositive: true }
          }
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Low Stock Products"
          value={lowStockCount.toLocaleString()}
          subtext="Items below threshold"
          trend={
            lowStockCount > 0
              ? { value: 'Replenish', isPositive: false }
              : { value: 'Stocked', isPositive: true }
          }
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Pending Returns / Refunds"
          value={pendingReturns.toLocaleString()}
          subtext="Awaiting review & resolution"
          trend={
            pendingReturns > 0
              ? { value: 'Pending', isPositive: false }
              : { value: 'None Pending', isPositive: true }
          }
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Total Products"
          value={totalProducts.toLocaleString()}
          subtext="Catalog items"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
      </div>

      {/* 4. Platform Growth / Overview & Operational Quick Actions */}
      <div className="admin-dash-grid">
        {/* Growth Chart */}
        <div className="admin-dash-card">
          <div className="admin-dash-card-header">
            <div className="admin-dash-card-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Platform &amp; Commerce Growth Timeline</span>
            </div>
            <Link
              href="/admin/reports"
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
            >
              Operational Reports →
            </Link>
          </div>
          <AdminGrowthChart data={data.growth} />
        </div>

        {/* Operational Quick Actions Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <div className="admin-dash-card-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Operational Shortcuts</span>
              </div>
            </div>
            <div className="admin-quick-actions-grid">
              <Link href="/admin/orders" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Orders</span>
              </Link>
              <Link href="/admin/products" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span>Products</span>
              </Link>
              <Link href="/admin/inventory" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Inventory</span>
              </Link>
              <Link href="/admin/seller-approvals" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Seller Approvals</span>
              </Link>
              <Link href="/admin/returns" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Returns</span>
              </Link>
              <Link href="/admin/shipping" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Shipping</span>
              </Link>
              <Link href="/admin/reviews" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Reviews</span>
              </Link>
              <Link href="/admin/payments" className="admin-quick-action-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span>Payments</span>
              </Link>
            </div>
          </div>

          {/* Operational Seller Verification Overview */}
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <div className="admin-dash-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Seller Onboarding Pipeline</span>
              </div>
              <Link
                href="/admin/seller-approvals"
                style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
              >
                Review All →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success-text)' }}>
                  {data.sellerApprovalStatus.approved}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Approved
                </div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#854d0e' }}>
                  {data.sellerApprovalStatus.pending}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Pending Review
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Operational Tables Section */}
      
      {/* 5a. Recent Orders Table */}
      {data.recentOrders && data.recentOrders.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Marketplace Orders
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Live customer orders placed on the platform.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              View All Orders →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${Number(order.total || 0).toFixed(2)}
                    </td>
                    <td>
                      <AdminBadge status={order.status} />
                    </td>
                    <td>
                      <AdminBadge status={order.paymentStatus} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5b. Seller Approvals Pending Table */}
      {data.recentSellerApprovals && data.recentSellerApprovals.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sellers Requiring Verification
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                New seller applications awaiting administrative verification.
              </p>
            </div>
            <Link
              href="/admin/seller-approvals"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              Manage Approvals →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Seller</th>
                  <th>Verification Status</th>
                  <th>Date Submitted</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSellerApprovals.map((seller) => (
                  <tr key={seller.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{seller.storeName || 'Unnamed Store'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{seller.businessCategory || 'General Retail'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{seller.sellerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{seller.sellerEmail}</div>
                    </td>
                    <td>
                      <AdminBadge status={seller.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(seller.submittedAt || seller.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href="/admin/seller-approvals"
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
                      >
                        Review Application →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5c. Low Stock Alerts Table */}
      {data.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Low-Stock Inventory Warnings
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Products that have reached or fallen below the minimum stock threshold.
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              Inventory Management →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Seller Store</th>
                  <th>Available Stock</th>
                  <th>Threshold</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.productName}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{inv.sku}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{inv.storeName || inv.sellerName || 'Direct'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: inv.stockQuantity === 0 ? 'var(--error-text)' : '#854d0e' }}>
                        {inv.stockQuantity} units
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {inv.lowStockThreshold} units
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href="/admin/inventory"
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
                      >
                        Adjust Stock →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5d. Pending Returns & Refunds Table */}
      {data.recentReturns && data.recentReturns.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Returns &amp; Refund Requests
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Customer return disputes and refund requests requiring operational resolution.
              </p>
            </div>
            <Link
              href="/admin/returns"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              View All Returns →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentReturns.map((ret) => (
                  <tr key={ret.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ret.returnNumber}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem' }}>{ret.orderNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ret.customerName}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ret.reason}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${Number(ret.refundAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <AdminBadge status={ret.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href="/admin/returns"
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-forest-800)' }}
                      >
                        Resolve →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5e. Recent Payments Table */}
      {data.recentPayments && data.recentPayments.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Operational Payments
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Live payment transactions recorded across payment channels.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              Payments Ledger →
            </Link>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                        {p.transactionReference}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem' }}>{p.orderNumber || '-'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.customerName}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${Number(p.amount || 0).toFixed(2)} {p.currency}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{p.paymentMethod}</td>
                    <td>
                      <AdminBadge status={p.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5f. Recent Operational Activity (Audit Logs) */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Operational &amp; Administrative Activity
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Live immutable audit records of administrative operations.
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="btn-secondary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
          >
            Full Audit Logs →
          </Link>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                  >
                    No administrative activity recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentActivity.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-forest-800)',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.actorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.actorRole}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{log.targetType}</span>
                    </td>
                    <td>
                      <AdminBadge status={log.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
