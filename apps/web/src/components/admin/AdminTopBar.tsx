'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSearchResultItem } from '@tobetake/shared-types';
import { adminFetch, clearStoredAuthUser } from '@/lib/api';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
  user: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleCode: string;
  } | null;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onToggleSidebar, user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSearchResults(json.data.results || []);
            setShowSearchResults(true);
            setSelectedIndex(-1);
          }
        }
      } catch (err) {
        console.error('Failed to perform global search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelectResult = (item: AdminSearchResultItem) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    router.push(item.url);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchResults || searchResults.length === 0) {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectResult(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelectResult(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleSignOut = () => {
    clearStoredAuthUser();
    window.location.href = '/login/admin';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      handleSelectResult(searchResults[selectedIndex]);
    } else if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  };

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      linkUrl?: string | null;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchLiveNotifications = async () => {
    try {
      const res = await adminFetch('/api/admin/notifications?limit=5');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data.items || []);
          setUnreadCount(json.data.unreadCount ?? 0);
        }
      }
    } catch {
      // Background notifications fetch fallback
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent error
    }
  };

  const isSuperAdmin = user?.roleCode === 'SPADMIN';
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : isSuperAdmin
      ? 'SA'
      : 'AD';

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : isSuperAdmin
      ? 'Super Admin'
      : 'Administrator';

  const roleTitle = isSuperAdmin ? 'Super Admin' : user?.role || 'Admin';

  const getPageInfo = () => {
    if (pathname === '/admin/dashboard') {
      return {
        parent: 'Platform',
        current: isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard',
      };
    }
    // Commerce
    if (pathname.startsWith('/admin/orders')) {
      return { parent: 'Commerce', current: 'Orders Management' };
    }
    if (pathname.startsWith('/admin/products')) {
      return { parent: 'Commerce', current: 'Products & Catalog' };
    }
    if (pathname.startsWith('/admin/categories')) {
      return { parent: 'Commerce', current: 'Categories' };
    }
    if (pathname.startsWith('/admin/inventory')) {
      return { parent: 'Commerce', current: 'Inventory Management' };
    }
    if (pathname.startsWith('/admin/returns')) {
      return { parent: 'Commerce', current: 'Returns & Refunds' };
    }
    // Finance
    if (pathname.startsWith('/admin/payments')) {
      return { parent: 'Finance', current: 'Payments & Transactions' };
    }
    if (pathname.startsWith('/admin/commissions')) {
      return { parent: 'Finance', current: 'Marketplace Commissions' };
    }
    if (pathname.startsWith('/admin/payouts')) {
      return { parent: 'Finance', current: 'Seller Payouts' };
    }
    // Operations
    if (pathname.startsWith('/admin/shipping')) {
      return { parent: 'Operations', current: 'Shipping & Logistics' };
    }
    if (pathname.startsWith('/admin/reviews')) {
      return { parent: 'Operations', current: 'Reviews & Moderation' };
    }
    if (pathname.startsWith('/admin/notifications')) {
      return { parent: 'Operations', current: 'Notification Center' };
    }
    // Administration & Users
    if (pathname.startsWith('/admin/users/customers')) {
      return { parent: 'Administration', current: 'Customers' };
    }
    if (pathname.startsWith('/admin/users/sellers')) {
      return { parent: 'Administration', current: 'Sellers' };
    }
    if (pathname.startsWith('/admin/users/admins')) {
      return { parent: 'Administration', current: 'Administrators' };
    }
    if (pathname.startsWith('/admin/users')) {
      return { parent: 'Administration', current: 'Users' };
    }
    if (pathname.startsWith('/admin/seller-approvals')) {
      return { parent: 'Commerce', current: 'Seller Approvals' };
    }
    if (pathname.startsWith('/admin/roles-permissions')) {
      return { parent: 'Administration', current: 'Roles & Permissions' };
    }
    if (pathname.startsWith('/admin/reports')) {
      return { parent: 'Analytics', current: 'Marketplace Reports' };
    }
    if (pathname.startsWith('/admin/audit-logs')) {
      return { parent: 'Administration', current: 'Audit Logs' };
    }
    if (pathname.startsWith('/admin/security')) {
      return { parent: 'Administration', current: 'Security Center' };
    }
    if (pathname.startsWith('/admin/settings')) {
      return { parent: 'Administration', current: 'Platform Settings' };
    }
    if (pathname.startsWith('/admin/profile')) {
      return { parent: 'Account', current: isSuperAdmin ? 'Super Admin Profile' : 'Admin Profile' };
    }
    return { parent: 'Platform', current: 'Management' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="admin-mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb Context */}
        <div className="admin-breadcrumb-nav">
          <span className="admin-breadcrumb-parent">{pageInfo.parent}</span>
          <span className="admin-breadcrumb-sep">/</span>
          <span className="admin-breadcrumb-current">{pageInfo.current}</span>
        </div>

        {/* Global Search */}
        <div className="admin-search-wrapper" ref={searchWrapperRef}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
            <svg
              className="admin-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search orders, products, sellers..."
              className="admin-search-input"
              aria-label="Global Admin Search"
              aria-autocomplete="list"
              aria-expanded={showSearchResults}
            />
            {isSearching && (
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(20,41,31,0.2)',
                    borderTopColor: 'var(--color-forest-700)',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              </div>
            )}
          </form>

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div
              className="admin-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '100%',
                minWidth: '340px',
                maxHeight: '380px',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '0.35rem 0',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
              }}
              role="listbox"
            >
              {isSearching && searchResults.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>Searching PostgreSQL database...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                  }}
                >
                  No matching orders, customers, sellers, or products found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Search Results ({searchResults.length})</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 400, textTransform: 'none' }}>
                      ↑↓ to navigate, ↵ to select
                    </span>
                  </div>
                  {searchResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const badgeStyles: Record<string, { bg: string; color: string; label: string }> = {
                      order: { bg: '#e0f2fe', color: '#0369a1', label: 'ORDER' },
                      customer: { bg: '#ecfdf5', color: '#047857', label: 'CUSTOMER' },
                      seller: { bg: '#fef3c7', color: '#b45309', label: 'SELLER' },
                      product: { bg: '#f3e8ff', color: '#7e22ce', label: 'PRODUCT' },
                    };
                    const badge = badgeStyles[item.type] || { bg: '#f1f5f9', color: '#475569', label: item.type.toUpperCase() };

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          backgroundColor: isSelected ? 'rgba(20, 41, 31, 0.05)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--color-forest-700)' : '3px solid transparent',
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: badge.bg,
                                color: badge.color,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          {item.subtitle && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        {item.badgeText && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="admin-topbar-right">
        {/* System Status Pill */}
        <div className="admin-live-indicator">
          <span className="admin-live-dot" />
          <span className="admin-live-text">Marketplace Live</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="View notifications"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
                  background: '#a82323',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="admin-dropdown-menu" style={{ width: '340px', right: 0 }}>
              <div
                style={{
                  padding: '0.6rem 0.75rem',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span>Notification Center</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#a82323', fontWeight: 600 }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                        backgroundColor: notif.isRead ? 'transparent' : 'rgba(212, 163, 75, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--color-forest-700)',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {notif.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link
                href="/admin/notifications"
                className="admin-dropdown-item"
                onClick={() => setShowNotifications(false)}
                style={{
                  textAlign: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '0.65rem',
                }}
              >
                View All Notifications →
              </Link>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            type="button"
            className="admin-user-menu-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-expanded={showProfileMenu}
            aria-label="User profile menu"
          >
            <div className={`admin-avatar ${isSuperAdmin ? 'spadmin' : ''}`}>{initials}</div>
            <div className="admin-user-meta">
              <span className="admin-user-name">{displayName}</span>
              <span className="admin-user-role">{roleTitle}</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginLeft: '0.2rem', color: 'var(--text-muted)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="admin-dropdown-menu">
              <div style={{ padding: '0.65rem 0.75rem' }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{displayName}</span>
                  {isSuperAdmin && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: '#fdf4ff',
                        color: '#86198f',
                        border: '1px solid #f0abfc',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      Super Admin
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}
                >
                  {user?.email || (isSuperAdmin ? 'superadmin@tobetake.dev' : 'admin@tobetake.dev')}
                </div>
              </div>
              <div className="admin-dropdown-divider" />
              <Link
                href="/admin/profile"
                className="admin-dropdown-item"
                onClick={() => setShowProfileMenu(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{isSuperAdmin ? 'Super Admin Profile' : 'Admin Profile'}</span>
              </Link>
              <Link
                href="/admin/security"
                className="admin-dropdown-item"
                onClick={() => setShowProfileMenu(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Security Center</span>
              </Link>
              <Link
                href="/admin/settings"
                className="admin-dropdown-item"
                onClick={() => setShowProfileMenu(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Platform Settings</span>
              </Link>
              <div className="admin-dropdown-divider" />
              <button
                type="button"
                onClick={handleSignOut}
                className="admin-dropdown-item"
                style={{ color: '#dc2626' }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
