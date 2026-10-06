'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { customerApi } from '../../../lib/customer-api';
import { CustomerProfileSummary } from '@tobetake/shared-types';

export default function AccountOverviewPage(): React.ReactElement {
  const [profile, setProfile] = useState<CustomerProfileSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profData, ordersData] = await Promise.all([
          customerApi.getProfile(),
          customerApi.getOrders(),
        ]);
        setProfile(profData);
        setRecentOrders(ordersData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#526359' }}>Loading dashboard overview...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '14px', padding: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📦</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14291f', margin: '0.5rem 0 0.15rem' }}>
            {profile?.totalOrders || 0}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Total Orders</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '14px', padding: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>❤️</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14291f', margin: '0.5rem 0 0.15rem' }}>
            {profile?.totalWishlist || 0}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Wishlist Items</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '14px', padding: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⭐</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14291f', margin: '0.5rem 0 0.15rem' }}>
            {profile?.totalReviews || 0}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Reviews Written</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '14px', padding: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔔</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14291f', margin: '0.5rem 0 0.15rem' }}>
            {profile?.unreadNotifications || 0}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Unread Alerts</span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
            Recent Orders
          </h2>
          <Link href="/account/orders" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#d4a34b', textDecoration: 'none' }}>
            View All ({profile?.totalOrders || 0}) →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '1px solid #f0ebe1',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#14291f', fontSize: '0.9375rem' }}>#{order.orderNumber}</strong>
                    <span style={{ fontSize: '0.6875rem', background: '#e6f4ec', color: '#196338', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                      {order.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#82948a', margin: 0 }}>
                    {new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })} • {order.itemCount} items • {order.carrier}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14291f' }}>
                    Rs. {Number(order.totalAmount).toLocaleString()}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.95rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Track Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#82948a', fontSize: '0.875rem', margin: 0, padding: '1rem 0' }}>
            No orders placed yet.
          </p>
        )}
      </div>
    </div>
  );
}
