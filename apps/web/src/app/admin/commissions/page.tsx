'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AdminCommissionRecordItem,
  CommissionConfig,
  PaginatedResult,
} from '@tobetake/shared-types';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function AdminCommissionsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminCommissionRecordItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [config, setConfig] = useState<CommissionConfig>({
    totalPlatformFee: 0,
    totalSellerEarnings: 0,
    pendingCommissions: 0,
    defaultCommissionRate: 10,
    defaultRatePercent: 10,
    defaultFixedFee: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Config modal
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [ratePercent, setRatePercent] = useState<number>(10);
  const [fixedFee, setFixedFee] = useState<number>(0);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchCommissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '10');

      const [commRes, configRes] = await Promise.all([
        adminFetch(`/api/admin/commissions?${params.toString()}`),
        adminFetch('/api/admin/commissions/config'),
      ]);

      if (commRes.ok) {
        const json = await commRes.json();
        if (json.success && json.data) setData(json.data);
      }

      if (configRes.ok) {
        const json = await configRes.json();
        if (json.success && json.data) {
          setConfig(json.data);
          setRatePercent(json.data.defaultRatePercent);
          setFixedFee(json.data.defaultFixedFee);
        }
      }
    } catch (err) {
      console.error('Failed to load commissions:', err);
      showToast('error', 'Failed to load commissions ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await adminFetch('/api/admin/commissions/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultRatePercent: Number(ratePercent),
          defaultFixedFee: Number(fixedFee),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save commission rates');
      showToast('success', 'Marketplace platform commission rates updated.');
      setShowConfigModal(false);
      fetchCommissions();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSavingConfig(false);
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
          <div className="admin-welcome-tag">Marketplace Monetization</div>
          <h1 className="admin-welcome-title">Commission Rates &amp; Revenue Splits</h1>
          <p className="admin-welcome-desc">
            Configure global marketplace take-rates, manage vendor fee calculations, and audit
            order-level gross revenue splits in real time.
          </p>
          <div className="admin-welcome-actions">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="admin-banner-action-btn primary"
            >
              ⚙️ Configure Commission Rates
            </button>
          </div>
        </div>
      </div>

      {/* Rate KPIs */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Default Platform Take-Rate</span>
            <div className="admin-kpi-icon-box">📊</div>
          </div>
          <div className="admin-kpi-value">
            {config.defaultRatePercent ?? config.defaultCommissionRate ?? 10}%
          </div>
          <div className="admin-kpi-subtext">Applied across all marketplace orders</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Fixed Transaction Fee</span>
            <div className="admin-kpi-icon-box">💵</div>
          </div>
          <div className="admin-kpi-value">{formatPKR(config.defaultFixedFee || 0)}</div>
          <div className="admin-kpi-subtext">Per order fixed surcharge</div>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchCommissions();
            }}
            style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, vendor name, store..."
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
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Seller Store</th>
                <th>Order Gross</th>
                <th>Commission Rate</th>
                <th>Platform Cut</th>
                <th>Seller Net Earnings</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading commissions ledger...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No commission records found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${rec.orderId}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-forest-700)',
                          textDecoration: 'underline',
                        }}
                      >
                        {rec.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rec.storeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rec.sellerName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {formatPKR(rec.orderAmount || 0)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {rec.ratePercent ?? rec.commissionRate ?? 10}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent-gold-text)' }}>
                        +{formatPKR(rec.platformAmount ?? rec.platformFee ?? 0)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>
                        {formatPKR(rec.sellerAmount ?? rec.sellerEarnings ?? 0)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color:
                            rec.isPaidToSeller || rec.status === 'PAID'
                              ? 'var(--success-text)'
                              : '#854d0e',
                        }}
                      >
                        {rec.isPaidToSeller || rec.status === 'PAID'
                          ? 'PAID OUT'
                          : 'PENDING PAYOUT'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
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
              Showing {data.items.length} of {data.total} records (Page {data.page} of{' '}
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

      {/* Config Modal */}
      {showConfigModal && (
        <AdminModal
          isOpen={true}
          title="Marketplace Platform Commission Settings"
          onClose={() => setShowConfigModal(false)}
          onConfirm={handleSaveConfig}
          confirmLabel={isSavingConfig ? 'Saving...' : 'Save Settings'}
          confirmVariant="primary"
          isSubmitting={isSavingConfig}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Default Take-Rate Percentage (%) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={ratePercent}
                onChange={(e) => setRatePercent(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
              <div
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
              >
                Example: 10% means platform retains 10% and vendor receives 90% of order GMV.
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
                Fixed Fee Per Transaction (PKR / Rs)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fixedFee}
                onChange={(e) => setFixedFee(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
