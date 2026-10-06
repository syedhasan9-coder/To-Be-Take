'use client';

import React, { useEffect, useState } from 'react';
import { ReportsData } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminGrowthChart } from '@/components/admin/AdminGrowthChart';
import { AdminKpiCard } from '@/components/admin/AdminKpiCard';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function PlatformReportsPage(): React.ReactElement {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/reports');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Failed to parse reports');
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await adminFetch('/api/admin/reports/export');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export platform reports:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span className="spinner" style={{ marginRight: '0.75rem' }} />
        <span>Aggregating platform database metrics &amp; reports...</span>
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
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Unable to Load Reports
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </p>
        <button type="button" onClick={fetchReports} className="btn-admin">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Platform Performance &amp; Growth Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time analytics aggregated directly from the To Be Take PostgreSQL database.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="btn-admin"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
          >
            {isExporting ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export CSV</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
          >
            <span>🖨 Print Summary</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="admin-kpi-grid">
        <AdminKpiCard
          label="Total Registered Accounts"
          value={data.summary.totalAccounts.toLocaleString()}
          subtext="Across all platform user roles"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Verified Email Rate"
          value={`${data.summary.verifiedEmailRate}%`}
          subtext="Accounts with confirmed email"
          trend={{ value: 'Verified', isPositive: true }}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Marketplace GMV"
          value={formatPKR(data.summary.totalSalesVolume)}
          subtext={`${data.summary.totalOrders ?? 0} orders processed`}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Platform Commissions"
          value={formatPKR(data.summary.totalPlatformCommissions)}
          subtext={`Avg order: ${formatPKR(data.summary.averageOrderValue)}`}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Approved Vendor Stores"
          value={data.sellerApprovals.approved.toLocaleString()}
          subtext={`${data.sellerApprovals.pending} pending applications`}
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
          label="Active Account Ratio"
          value={`${data.summary.totalAccounts > 0 ? Math.round((data.activeVsInactive.active / data.summary.totalAccounts) * 100) : 100}%`}
          subtext={`${data.activeVsInactive.suspended} suspended accounts`}
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
      </div>

      {/* Platform Growth Section */}
      <div className="admin-table-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          Historical User Growth Telemetry
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Real monthly registration trends across buyer, seller, and administrator accounts.
        </p>
        <AdminGrowthChart data={data.growth} />
      </div>

      {/* Grid: Active vs Inactive & Seller Categories */}
      <div className="admin-dash-grid">
        {/* Account Status Breakdown */}
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Account Status Breakdown</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--success-text)' }}>
                ● Active Accounts
              </span>
              <span style={{ fontWeight: 700 }}>{data.activeVsInactive.active}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontWeight: 600, color: '#854d0e' }}>● Pending Verification</span>
              <span style={{ fontWeight: 700 }}>{data.activeVsInactive.pendingVerification}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontWeight: 600, color: '#475569' }}>● Inactive Accounts</span>
              <span style={{ fontWeight: 700 }}>{data.activeVsInactive.inactive}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ fontWeight: 600, color: 'var(--error-text)' }}>
                ● Suspended Accounts
              </span>
              <span style={{ fontWeight: 700 }}>{data.activeVsInactive.suspended}</span>
            </div>
          </div>
        </div>

        {/* Seller Category Breakdown */}
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
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Seller Business Categories</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {data.registrationsByCategory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                No categorized sellers registered yet.
              </div>
            ) : (
              data.registrationsByCategory.map((cat, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-800)' }}>
                    {cat.count} stores
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Marketplace Sellers */}
      {data.commerceMetrics?.topSellers && data.commerceMetrics.topSellers.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-header-bar">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Top Performing Marketplace Vendors
            </h2>
          </div>
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendor Store</th>
                  <th>Seller Name</th>
                  <th>Total Revenue (PKR)</th>
                  <th>Orders Fulfilled</th>
                </tr>
              </thead>
              <tbody>
                {data.commerceMetrics.topSellers.map((seller, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {seller.storeName || 'Independent Vendor'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{seller.sellerName}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>
                        {formatPKR(seller.revenue)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{seller.ordersCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Admin Audit Activity */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Governance &amp; Administrative Activity
          </h2>
        </div>
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Administrator</th>
                <th>Target</th>
                <th>Status</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAdminActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                  >
                    No administrative audit events recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentAdminActivities.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <code style={{ fontWeight: 600, color: 'var(--color-forest-800)' }}>
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.actorName}</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginLeft: '0.4rem',
                        }}
                      >
                        ({log.actorRole})
                      </span>
                    </td>
                    <td>{log.targetType}</td>
                    <td>
                      <AdminBadge status={log.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleString()}
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
