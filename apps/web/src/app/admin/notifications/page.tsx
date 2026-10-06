'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminNotificationItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function AdminNotificationsPage(): React.ReactElement {
  const [data, setData] = useState<
    PaginatedResult<AdminNotificationItem> & { unreadCount: number }
  >({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (unreadOnly) params.set('unreadOnly', 'true');
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await adminFetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      showToast('error', 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, unreadOnly, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update');
      showToast('info', 'Notification marked as read.');
      fetchNotifications();
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await adminFetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update');
      showToast('success', 'All notifications marked as read.');
      fetchNotifications();
    } catch (err) {
      showToast('error', (err as Error).message);
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
          <div className="admin-welcome-tag">Marketplace Operations Center</div>
          <h1 className="admin-welcome-title">Notification Center</h1>
          <p className="admin-welcome-desc">
            Centralized telemetry and alerts for vendor applications, customer checkouts, inventory
            stock-outs, return disputes, and system anomalies.
          </p>
          <div className="admin-welcome-actions">
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="admin-banner-action-btn primary"
              >
                ✓ Mark All ({data.unreadCount}) as Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: '#ffffff',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Event Categories</option>
              <option value="SELLER_APPROVAL">Seller Onboarding Alerts</option>
              <option value="ORDER_ALERT">Order Activity</option>
              <option value="LOW_STOCK">Low Stock Alerts</option>
              <option value="RETURN_REQUEST">Return &amp; Refund Requests</option>
              <option value="PAYMENT_ALERT">Payment &amp; Treasury</option>
              <option value="SYSTEM">System &amp; Security</option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: unreadOnly ? 'rgba(212, 163, 75, 0.15)' : 'var(--bg-cream)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Unread Only ({data.unreadCount})</span>
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ padding: '0.5rem 1rem' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading notifications...
            </div>
          ) : data.items.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No notifications found matching filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.items.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: notif.isRead ? 'var(--bg-surface)' : 'rgba(212, 163, 75, 0.05)',
                    boxShadow: 'var(--shadow-sm)',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <AdminBadge status={notif.type} size="sm" />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{notif.title}</span>
                      {!notif.isRead && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-gold)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      {notif.message}
                    </p>

                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {notif.linkUrl && (
                      <Link
                        href={notif.linkUrl}
                        className="admin-banner-action-btn"
                        style={{
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.78rem',
                          color: 'var(--color-forest-800)',
                          background: 'var(--bg-cream)',
                          borderColor: 'var(--border-medium)',
                        }}
                      >
                        View Resource →
                      </Link>
                    )}

                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="admin-banner-action-btn"
                        style={{
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-medium)',
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Showing {data.items.length} of {data.total} notifications (Page {data.page} of{' '}
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
    </div>
  );
}
