'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCustomer } from '../../../components/customer/CustomerContext';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout, unreadNotificationsCount } = useCustomer();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/login/user?redirect=' + encodeURIComponent(pathname));
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  if (!isInitialized) {
    return (
      <div style={{ maxWidth: '1320px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: '#526359', fontSize: '1rem', fontWeight: 600 }}>Loading customer workspace...</p>
      </div>
    );
  }

  const navItems = [
    { label: '📊 Dashboard Overview', href: '/account' },
    { label: '📦 My Orders & Tracking', href: '/account/orders' },
    { label: '📍 Delivery Addresses', href: '/account/addresses' },
    { label: '💳 Payment Methods', href: '/account/payment-methods' },
    { label: '🎟️ Coupons & Vouchers', href: '/account/coupons' },
    {
      label: '🔔 Notifications',
      href: '/account/notifications',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { label: '⭐ My Product Reviews', href: '/account/reviews' },
    { label: '❤️ Wishlist', href: '/wishlist' },
    { label: '⚙️ Profile & Settings', href: '/account/profile' },
  ];

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Account Header Strip */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14291f 0%, #1e4533 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#d4a34b',
              color: '#14291f',
              fontWeight: 800,
              fontSize: '1.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.firstName?.[0] || 'C'}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              🇵🇰 Customer Account
            </span>
            <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.75rem', fontWeight: 700, margin: '0.35rem 0 0.15rem' }}>
              Welcome back, {user?.firstName || 'Customer'}!
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#c1d1c7', margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/');
          }}
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Grid: Navigation Sidebar (Left) + Content (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar */}
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid #e8e3d9',
            borderRadius: '16px',
            padding: '0.75rem',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#14291f' : '#526359',
                    background: active ? '#f8f5ee' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span style={{ background: '#e05d5d', color: '#ffffff', fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main>{children}</main>
      </div>
    </div>
  );
}
