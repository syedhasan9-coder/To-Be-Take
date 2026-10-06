'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { sellerFetch } from '@/lib/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  targetUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  metadata?: any;
  createdAt: string;
}

export default function SellerNotificationsPage(): React.ReactElement {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = unreadOnly ? '?unreadOnly=true' : '';
      const res = await sellerFetch(`/api/seller/notifications${query}`);

      if (!res.ok) {
        throw new Error('Failed to load notifications');
      }

      const json = await res.json();
      const list: NotificationItem[] =
        json.data?.notifications || json.notifications || (Array.isArray(json) ? json : []);
      setNotifications(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await sellerFetch(`/api/seller/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const res = await sellerFetch(`/api/seller/notifications/read-all`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err: any) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order':
      case 'order_created':
      case 'order_shipped':
        return '🛍️';
      case 'inventory':
      case 'low_stock':
      case 'out_of_stock':
        return '📦';
      case 'payout':
      case 'earnings':
        return '💰';
      case 'review':
        return '⭐';
      case 'warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="seller-notifications-page" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a3322', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Operational Notifications
            {unreadCount > 0 && (
              <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
            Real-time operational alerts for store orders, low inventory, fulfillment updates, and reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={unreadOnly ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
          >
            {unreadOnly ? 'Showing Unread' : 'Filter Unread'}
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              {markingAll ? 'Marking...' : '✓ Mark All Read'}
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.875rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1a3322' }}>
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
            Operational updates regarding your products, customer orders, and payouts will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '1.15rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                backgroundColor: n.isRead ? '#ffffff' : '#f0fdf4',
                borderColor: n.isRead ? '#e5e7eb' : '#bbf7d0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  {getTypeIcon(n.type)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: n.isRead ? 600 : 700,
                        color: '#1a3322',
                      }}
                    >
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#16a34a',
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                    {new Date(n.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={() => markAsRead(n.id)}
                  className="btn-secondary"
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    backgroundColor: '#ffffff',
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
