'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredAuthUser } from '@/lib/api';

interface SellerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const pathname = usePathname();
  const router = useRouter();

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

  const storeDisplayName = user?.storeName || 'My Marketplace Store';

  const isActive = (path: string) => {
    if (path === '/seller/dashboard') return pathname === '/seller/dashboard';
    if (path === '/seller/products/new') return pathname === '/seller/products/new';
    if (path === '/seller/products') {
      return (
        pathname === '/seller/products' ||
        (pathname.startsWith('/seller/products/') && pathname !== '/seller/products/new')
      );
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleSignOut = () => {
    clearStoredAuthUser();
    router.push('/login/seller');
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Seller Navigation Sidebar"
    >
      {/* Brand Header */}
      <div className="admin-sidebar-header">
        <Link href="/seller/dashboard" className="admin-sidebar-brand" onClick={onClose}>
          <div
            className="admin-sidebar-logo-icon"
            style={{
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: '#d4a373',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div className="admin-sidebar-title">To Be Take</div>
            <div
              className="admin-sidebar-tag"
              style={{ color: '#d4a373', fontWeight: 600 }}
            >
              Seller Workspace
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="admin-sidebar-nav">
        {/* OVERVIEW */}
        <div className="admin-nav-section-title">Overview</div>
        <Link
          href="/seller/dashboard"
          className={`admin-nav-link ${isActive('/seller/dashboard') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>Dashboard</span>
        </Link>

        {/* STORE & PRODUCTS */}
        <div className="admin-nav-section-title">Store &amp; Catalog</div>
        <Link
          href="/seller/products"
          className={`admin-nav-link ${isActive('/seller/products') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Products</span>
        </Link>
        <Link
          href="/seller/products/new"
          className={`admin-nav-link ${isActive('/seller/products/new') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>Add Product</span>
        </Link>

        {/* INVENTORY */}
        <div className="admin-nav-section-title">Inventory</div>
        <Link
          href="/seller/inventory"
          className={`admin-nav-link ${isActive('/seller/inventory') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventory &amp; Stock</span>
        </Link>

        {/* ORDERS & FULFILLMENT */}
        <div className="admin-nav-section-title">Orders &amp; Fulfillment</div>
        <Link
          href="/seller/orders"
          className={`admin-nav-link ${isActive('/seller/orders') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>Orders</span>
        </Link>
        <Link
          href="/seller/shipping"
          className={`admin-nav-link ${isActive('/seller/shipping') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Shipping</span>
        </Link>
        <Link
          href="/seller/returns"
          className={`admin-nav-link ${isActive('/seller/returns') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Returns</span>
        </Link>

        {/* FINANCE */}
        <div className="admin-nav-section-title">Finance</div>
        <Link
          href="/seller/earnings"
          className={`admin-nav-link ${isActive('/seller/earnings') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Earnings</span>
        </Link>
        <Link
          href="/seller/commissions"
          className={`admin-nav-link ${isActive('/seller/commissions') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
          <span>Commissions</span>
        </Link>
        <Link
          href="/seller/payouts"
          className={`admin-nav-link ${isActive('/seller/payouts') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>Payouts</span>
        </Link>

        {/* CUSTOMER ENGAGEMENT */}
        <div className="admin-nav-section-title">Customer Engagement</div>
        <Link
          href="/seller/reviews"
          className={`admin-nav-link ${isActive('/seller/reviews') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Reviews</span>
        </Link>
        <Link
          href="/seller/notifications"
          className={`admin-nav-link ${isActive('/seller/notifications') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Notifications</span>
        </Link>

        {/* STORE MANAGEMENT */}
        <div className="admin-nav-section-title">Store Management</div>
        <Link
          href="/seller/profile"
          className={`admin-nav-link ${isActive('/seller/profile') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Store Profile</span>
        </Link>
      </nav>

      {/* Footer / Store Identity */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user-card">
          <Link
            href="/seller/profile"
            className="admin-sidebar-user-link"
            onClick={onClose}
            title="View Store Profile"
          >
            <div
              className="admin-sidebar-avatar"
              style={{ background: '#2d6a4f', color: '#ffffff' }}
            >
              {initials}
            </div>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storeDisplayName}
              </span>
              <span className="admin-sidebar-user-role" style={{ color: '#d4a373' }}>
                Verified Seller
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="admin-sidebar-signout-btn"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
