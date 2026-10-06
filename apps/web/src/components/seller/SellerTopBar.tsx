'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { sellerFetch, clearStoredAuthUser } from '@/lib/api';

interface SellerTopBarProps {
  onToggleSidebar: () => void;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    roleCode?: string;
    storeName?: string | null;
    businessCategory?: string | null;
  } | null;
}

export const SellerTopBar: React.FC<SellerTopBarProps> = ({
  onToggleSidebar,
  user,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const initials = user?.storeName
    ? user.storeName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.firstName
      ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
      : 'VN';

  const storeDisplayName = user?.storeName || 'Merchant Store';

  // Fetch unread notification count
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await sellerFetch('/api/seller/notifications?limit=1');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setUnreadCount(json.data.unreadCount || 0);
          }
        }
      } catch {
        // Suppress background poll errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/seller/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSignOut = () => {
    clearStoredAuthUser();
    router.push('/login/seller');
  };

  return (
    <header className="admin-topbar" role="banner">
      {/* Left Area: Toggle & Store Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="admin-topbar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="admin-topbar-context" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(45, 106, 79, 0.1)',
              color: 'var(--color-forest-800, #1b4332)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#16a34a',
                display: 'inline-block',
              }}
            />
            {storeDisplayName}
          </span>

          {user?.email && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
              title={`Seller ID: ${user.id || 'N/A'}`}
            >
              {user.email} {user.id ? `(${user.id.slice(0, 8)}...)` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Center Search Input */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search products or SKU in your store..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 1rem 0.45rem 2.2rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-linen-300, #e2d9cc)',
                background: 'var(--color-linen-50, #fcfbf9)',
                color: 'var(--text-dark, #1c2826)',
              }}
            />
            <svg
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #718096)',
              }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </form>
      </div>

      {/* Right Area: Actions & Profile Dropdown */}
      <div className="admin-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notifications Icon */}
        <Link
          href="/seller/notifications"
          className="admin-topbar-btn"
          title="Seller Notifications"
          aria-label="Seller Notifications"
          style={{ position: 'relative' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
            aria-expanded={profileOpen}
            aria-label="User Account Menu"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#2d6a4f',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="seller-name-header">
              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{storeDisplayName}</div>
            </div>
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.5rem',
                width: '220px',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--color-linen-300, #e2d9cc)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#faf8f5' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b4332' }}>{storeDisplayName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email || 'seller@tobetake.com'}</div>
              </div>

              <div style={{ padding: '0.35rem 0' }}>
                <Link
                  href="/seller/profile"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.5rem 1rem',
                    fontSize: '0.825rem',
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Store Profile
                </Link>
                <Link
                  href="/seller/earnings"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.5rem 1rem',
                    fontSize: '0.825rem',
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Earnings &amp; Payouts
                </Link>
                <Link
                  href="/seller/notifications"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.5rem 1rem',
                    fontSize: '0.825rem',
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Notifications
                </Link>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.35rem 0' }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    fontSize: '0.825rem',
                    color: '#dc2626',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
