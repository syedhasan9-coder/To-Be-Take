'use client';

import React from 'react';
import Link from 'next/link';
import { useCustomer } from '../../../../components/customer/CustomerContext';

export default function AccountNotificationsPage(): React.ReactElement {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCustomer();

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.75rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
            Customer Notifications
          </h1>
          <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Consignment tracking updates, order alerts, and seasonal voucher promotions.
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            style={{ background: 'none', border: 'none', color: '#d4a34b', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>🔔</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.35rem' }}>
            No notifications at this time
          </h3>
          <p style={{ color: '#82948a', fontSize: '0.8125rem' }}>
            Updates regarding your orders and courier shipments will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {notifications.map((n) => {
            const isOrder = n.type === 'ORDER';
            const isShipping = n.type === 'SHIPPING';
            const icon = isOrder ? '📦' : isShipping ? '🚚' : '🎉';

            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markNotificationRead(n.id)}
                style={{
                  border: '1px solid',
                  borderColor: n.isRead ? '#f0ebe1' : '#dcd5c7',
                  background: n.isRead ? '#ffffff' : '#fdfcf7',
                  borderRadius: '12px',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: n.isRead ? 'default' : 'pointer',
                  boxShadow: n.isRead ? 'none' : '0 2px 8px rgba(20, 41, 31, 0.04)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isOrder ? '#e6f4ec' : isShipping ? '#f8f5ee' : '#fff8f0',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
                      {n.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#82948a' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: '#526359', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {n.message}
                  </p>

                  {n.targetUrl && (
                    <Link
                      href={n.targetUrl}
                      style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a34b', textDecoration: 'none' }}
                    >
                      View Details →
                    </Link>
                  )}
                </div>

                {!n.isRead && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#e05d5d',
                      flexShrink: 0,
                      marginTop: '6px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
