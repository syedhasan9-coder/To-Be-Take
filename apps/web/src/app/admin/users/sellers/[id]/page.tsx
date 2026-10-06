'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SellerCommerceDetail, UserStatusType } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';
import { formatPKR, formatPrice } from '@/lib/currency';

export default function Seller360Page(): React.ReactElement {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerCommerceDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'payouts'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<UserStatusType>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchSeller360 = useCallback(async () => {
    if (!sellerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/users/sellers/${sellerId}/commerce`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Seller account was not found.');
        }
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setSeller(json.data);
      } else {
        throw new Error(json.message || 'Failed to retrieve seller 360 data.');
      }
    } catch (err) {
      console.error('Failed to load seller 360:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchSeller360();
  }, [fetchSeller360]);

  const handleOpenStatusModal = (nextStatus: UserStatusType) => {
    setTargetStatus(nextStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!seller) return;
    setIsSubmittingStatus(true);
    try {
      const res = await adminFetch(`/api/admin/users/${seller.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Status update failed.');
      }

      showToast(
        'success',
        `Seller status successfully updated to ${targetStatus}.`,
      );
      setIsStatusModalOpen(false);
      fetchSeller360();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '36px', height: '36px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading Seller 360 Profile...</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Retrieving seller catalog, commission earnings, and payout records from PostgreSQL.
        </p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
        <Link
          href="/admin/users/sellers"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}
        >
          ← Back to Sellers
        </Link>
        <div
          className="admin-dash-card"
          style={{ padding: '2.5rem', textAlign: 'center', borderColor: 'var(--error-border)' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--error-text)', marginBottom: '0.5rem' }}>
            Seller Profile Error
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The requested seller account could not be retrieved.'}
          </p>
          <button type="button" onClick={fetchSeller360} className="admin-banner-action-btn primary">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    commerceSummary,
    products = [],
    recentOrders = [],
    recentPayouts = [],
  } = seller;

  return (
    <div>
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Top Breadcrumb / Navigation */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          href="/admin/users/sellers"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
        >
          ← Back to Sellers List
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {seller.status === 'ACTIVE' ? (
            <button
              type="button"
              onClick={() => handleOpenStatusModal('SUSPENDED')}
              className="btn-secondary"
              style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Suspend Seller
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenStatusModal('ACTIVE')}
              className="btn-secondary"
              style={{ color: '#166534', borderColor: '#86efac', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Activate Seller
            </button>
          )}
        </div>
      </div>

      {/* Seller 360 Header Banner */}
      <div className="admin-welcome-banner" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-welcome-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <div className="admin-welcome-tag">Seller / Vendor 360 Profile</div>
            <AdminBadge status={seller.status} />
            {seller.businessCategory && (
              <span className="admin-badge admin-badge-vendor" style={{ textTransform: 'none' }}>
                📁 {seller.businessCategory}
              </span>
            )}
          </div>
          <h1 className="admin-welcome-title" style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
            {seller.storeName || `${seller.firstName} ${seller.lastName}`}
          </h1>
          <p className="admin-welcome-desc" style={{ maxWidth: '800px' }}>
            Contact: <strong>{seller.firstName} {seller.lastName}</strong> &bull; Username: <code style={{ color: 'var(--accent-gold)' }}>@{seller.username}</code> &bull; Email: <strong>{seller.email}</strong> &bull; Registered: {new Date(seller.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* 5 Commerce KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Catalog Products
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {commerceSummary.totalProducts}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Active &amp; draft listings
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Gross Sales Volume
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-forest-800)' }}>
            ${commerceSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            From {commerceSummary.totalOrders} order line(s)
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Platform Fee Paid
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${commerceSummary.platformCommissionPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Commission collected
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Total Payouts Paid
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#166534' }}>
            ${commerceSummary.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Disbursed settlements
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Pending Settlement
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: commerceSummary.pendingBalance > 0 ? '#854d0e' : 'var(--text-secondary)' }}>
            ${commerceSummary.pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Awaiting disbursement
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Store Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          Catalog Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          Recent Order Items ({recentOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`admin-tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
        >
          Payout Disbursements ({recentPayouts.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <h2 className="admin-dash-card-title">
                <span>🏢</span> Merchant Registration &amp; Identity
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Store Name</span>
                <span style={{ fontWeight: 600 }}>{seller.storeName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Business Category</span>
                <span>{seller.businessCategory || 'General Merchandise'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Owner</span>
                <span>{seller.firstName} {seller.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                <span>@{seller.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                <span>{seller.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Status</span>
                <AdminBadge status={seller.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Created On</span>
                <span>{new Date(seller.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="admin-dash-card">
            <div className="admin-dash-card-header">
              <h2 className="admin-dash-card-title">
                <span>⚡</span> Operational Summary
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Product Listings</span>
                <strong>{commerceSummary.totalProducts}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Orders Handled</span>
                <strong>{commerceSummary.totalOrders}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lifetime Gross Sales</span>
                <strong style={{ color: 'var(--color-forest-800)' }}>{formatPKR(commerceSummary.totalRevenue)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Commission Contributed</span>
                <strong>{formatPKR(commerceSummary.platformCommissionPaid)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Payouts Settled</span>
                <strong style={{ color: '#166534' }}>{formatPKR(commerceSummary.totalPayouts)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Payout Balance</span>
                <strong style={{ color: commerceSummary.pendingBalance > 0 ? '#854d0e' : 'inherit' }}>
                  {formatPKR(commerceSummary.pendingBalance)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === 'products' && (
        <div className="admin-table-container">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      This seller has not published any catalog products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/admin/products/${p.id}`}
                          style={{ fontWeight: 600, color: 'var(--color-forest-800)', textDecoration: 'none' }}
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.82rem' }}>{p.sku}</code>
                      </td>
                      <td>{p.categoryName || 'General'}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(p.price)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: p.stockQuantity === 0 ? '#dc2626' : p.stockQuantity <= 5 ? '#854d0e' : '#166534' }}>
                          {p.stockQuantity} in stock
                        </span>
                      </td>
                      <td>
                        <AdminBadge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          Product Detail →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recent Orders */}
      {activeTab === 'orders' && (
        <div className="admin-table-container">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No order commission events recorded for this seller.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          style={{ fontWeight: 700, color: 'var(--color-forest-800)', textDecoration: 'underline' }}
                        >
                          #{ord.orderNumber}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <AdminBadge status={ord.status} />
                      </td>
                      <td>
                        <AdminBadge status={ord.paymentStatus} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatPKR(ord.total)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Payouts */}
      {activeTab === 'payouts' && (
        <div className="admin-table-container">
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payout #</th>
                  <th>Created Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Settlement Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No payout disbursements have been generated for this seller yet.
                    </td>
                  </tr>
                ) : (
                  recentPayouts.map((po) => (
                    <tr key={po.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {po.payoutNumber}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>
                        {formatPKR(po.amount)}
                      </td>
                      <td>
                        <AdminBadge status={po.status} />
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {po.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <AdminModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: ${seller.storeName || seller.username}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="btn-secondary"
                disabled={isSubmittingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`admin-banner-action-btn ${targetStatus === 'SUSPENDED' ? 'danger' : 'primary'}`}
                disabled={isSubmittingStatus}
              >
                {isSubmittingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <p>
              Are you sure you want to change the status of seller store{' '}
              <strong>{seller.storeName || seller.username}</strong> to <strong>{targetStatus}</strong>?
            </p>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Reason for status change (Audit Log)
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for suspension or activation (e.g. Quality audit compliance or store restoration)..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
