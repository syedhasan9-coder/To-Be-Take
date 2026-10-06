'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CustomerCommerceDetail, UserStatusType } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function Customer360Page(): React.ReactElement {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerCommerceDetail | null>(null);
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

  const fetchCustomer360 = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/users/customers/${customerId}/commerce`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Customer account was not found.');
        }
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setCustomer(json.data);
      } else {
        throw new Error(json.message || 'Failed to retrieve customer 360 data.');
      }
    } catch (err) {
      console.error('Failed to load customer 360:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer360();
  }, [fetchCustomer360]);

  const handleOpenStatusModal = (nextStatus: UserStatusType) => {
    setTargetStatus(nextStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!customer) return;
    setIsSubmittingStatus(true);
    try {
      const res = await adminFetch(`/api/admin/users/${customer.id}/status`, {
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
        `Customer status successfully updated to ${targetStatus}.`,
      );
      setIsStatusModalOpen(false);
      fetchCustomer360();
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading Customer 360 Profile...</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Retrieving lifetime orders, spend metrics, and account status from PostgreSQL.
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
        <Link
          href="/admin/users/customers"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}
        >
          ← Back to Customers
        </Link>
        <div
          className="admin-dash-card"
          style={{ padding: '2.5rem', textAlign: 'center', borderColor: 'var(--error-border)' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--error-text)', marginBottom: '0.5rem' }}>
            Customer Profile Error
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The requested customer account could not be retrieved.'}
          </p>
          <button type="button" onClick={fetchCustomer360} className="admin-banner-action-btn primary">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { commerceSummary, orders } = customer;

  return (
    <div>
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Top Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          href="/admin/users/customers"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
        >
          ← Back to Customers List
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {customer.status === 'ACTIVE' ? (
            <button
              type="button"
              onClick={() => handleOpenStatusModal('SUSPENDED')}
              className="btn-secondary"
              style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Suspend Account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenStatusModal('ACTIVE')}
              className="btn-secondary"
              style={{ color: '#166534', borderColor: '#86efac', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Activate Account
            </button>
          )}
        </div>
      </div>

      {/* Customer 360 Header Banner */}
      <div className="admin-welcome-banner" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-welcome-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <div className="admin-welcome-tag">Customer 360 Profile</div>
            <AdminBadge status={customer.status} />
            {customer.isEmailVerified ? (
              <span className="admin-badge admin-badge-active" style={{ textTransform: 'none' }}>
                ✓ Email Verified
              </span>
            ) : (
              <span className="admin-badge admin-badge-pending" style={{ textTransform: 'none' }}>
                Unverified Email
              </span>
            )}
          </div>
          <h1 className="admin-welcome-title" style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="admin-welcome-desc" style={{ maxWidth: '800px' }}>
            Username: <code style={{ color: 'var(--accent-gold)' }}>@{customer.username}</code> &bull; Email: <strong>{customer.email}</strong> &bull; Member since: {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* 4 Commerce KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Lifetime Orders
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {commerceSummary.totalOrders}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            All-time placed orders
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Lifetime Total Spend
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-forest-800)' }}>
            ${commerceSummary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Excluding cancelled orders
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Average Order Value
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${commerceSummary.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Per completed checkout
          </div>
        </div>

        <div className="admin-dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Last Active Purchase
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {commerceSummary.lastOrderDate ? new Date(commerceSummary.lastOrderDate).toLocaleDateString() : 'No Orders Yet'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Most recent checkout timestamp
          </div>
        </div>
      </div>

      {/* Account Identity Details Card */}
      <div className="admin-dash-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-dash-card-header">
          <h2 className="admin-dash-card-title">
            <span>👤</span> Account Details &amp; Security State
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', fontSize: '0.88rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Customer ID</div>
            <code style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{customer.id}</code>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Full Legal Name</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer.firstName} {customer.lastName}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Registered Email</div>
            <div>{customer.email}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Security Lock Status</div>
            <div>{customer.isLocked ? '🔒 Account Locked' : '🔓 Unlocked'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Last Login Timestamp</div>
            <div>{customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Never logged in'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Record Created</div>
            <div>{new Date(customer.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Order History Table */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Complete Order History ({orders.length})
          </div>
        </div>
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    This customer has not placed any orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
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
                    <td>{ord.itemCount ?? 1} item(s)</td>
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
                        Inspect Order →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Modal */}
      {isStatusModalOpen && (
        <AdminModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: ${customer.firstName} ${customer.lastName}`}
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
              Are you sure you want to change the account status of customer{' '}
              <strong>@{customer.username}</strong> to <strong>{targetStatus}</strong>?
            </p>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Reason for status change (Audit Trail)
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for suspension or activation (e.g. Terms violation or identity verification)..."
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
