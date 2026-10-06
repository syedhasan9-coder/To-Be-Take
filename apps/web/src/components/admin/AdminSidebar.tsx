'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredAuthUser } from '@/lib/api';

interface AdminSidebarProps {
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
    designation?: string | null;
    department?: string | null;
  } | null;
  userRoleCode?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  user,
  userRoleCode,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [usersExpanded, setUsersExpanded] = useState<boolean>(pathname.startsWith('/admin/users'));

  const effectiveRoleCode = user?.roleCode || userRoleCode;
  const isSuperAdmin = effectiveRoleCode === 'SPADMIN';

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

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return pathname === '/admin/dashboard';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleSignOut = () => {
    clearStoredAuthUser();
    window.location.href = '/login/admin';
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Admin Navigation Sidebar"
    >
      {/* Brand Header */}
      <div className="admin-sidebar-header">
        <Link href="/admin/dashboard" className="admin-sidebar-brand" onClick={onClose}>
          <div className="admin-sidebar-logo-icon">
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
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <div>
            <div className="admin-sidebar-title">To Be Take</div>
            <div className="admin-sidebar-tag">
              {isSuperAdmin ? 'Platform Super Admin' : 'Admin Portal'}
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="admin-sidebar-nav">
        {/* OVERVIEW */}
        <div className="admin-nav-section-title">Overview</div>
        <Link
          href="/admin/dashboard"
          className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>Dashboard</span>
        </Link>

        {/* CUSTOMERS & SELLERS */}
        <div className="admin-nav-section-title">Customers &amp; Sellers</div>
        <Link
          href="/admin/users/customers"
          className={`admin-nav-link ${isActive('/admin/users/customers') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Customers</span>
        </Link>
        <Link
          href="/admin/users/sellers"
          className={`admin-nav-link ${isActive('/admin/users/sellers') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Sellers</span>
        </Link>
        <Link
          href="/admin/seller-approvals"
          className={`admin-nav-link ${isActive('/admin/seller-approvals') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Seller Approvals</span>
        </Link>

        {/* CATALOG */}
        <div className="admin-nav-section-title">Catalog</div>
        <Link
          href="/admin/products"
          className={`admin-nav-link ${isActive('/admin/products') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Products</span>
        </Link>
        <Link
          href="/admin/categories"
          className={`admin-nav-link ${isActive('/admin/categories') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Categories</span>
        </Link>
        <Link
          href="/admin/inventory"
          className={`admin-nav-link ${isActive('/admin/inventory') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventory</span>
        </Link>

        {/* ORDERS & FULFILLMENT */}
        <div className="admin-nav-section-title">Orders &amp; Fulfillment</div>
        <Link
          href="/admin/orders"
          className={`admin-nav-link ${isActive('/admin/orders') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>Orders</span>
        </Link>
        <Link
          href="/admin/shipping"
          className={`admin-nav-link ${isActive('/admin/shipping') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Shipping</span>
        </Link>

        {/* FINANCE */}
        <div className="admin-nav-section-title">Finance</div>
        <Link
          href="/admin/payments"
          className={`admin-nav-link ${isActive('/admin/payments') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>Payments</span>
        </Link>
        <Link
          href="/admin/commissions"
          className={`admin-nav-link ${isActive('/admin/commissions') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
          <span>Commissions</span>
        </Link>
        <Link
          href="/admin/payouts"
          className={`admin-nav-link ${isActive('/admin/payouts') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Payouts</span>
        </Link>
        <Link
          href="/admin/returns"
          className={`admin-nav-link ${isActive('/admin/returns') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Returns</span>
        </Link>

        {/* ENGAGEMENT */}
        <div className="admin-nav-section-title">Engagement</div>
        <Link
          href="/admin/reviews"
          className={`admin-nav-link ${isActive('/admin/reviews') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Reviews</span>
        </Link>
        <Link
          href="/admin/notifications"
          className={`admin-nav-link ${isActive('/admin/notifications') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Notifications</span>
        </Link>

        {/* REPORTING */}
        <div className="admin-nav-section-title">Reporting</div>
        <Link
          href="/admin/reports"
          className={`admin-nav-link ${isActive('/admin/reports') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Reports</span>
        </Link>
        <Link
          href="/admin/audit-logs"
          className={`admin-nav-link ${isActive('/admin/audit-logs') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Audit Logs</span>
        </Link>

        {/* SUPER ADMIN GOVERNANCE ONLY */}
        {isSuperAdmin && (
          <>
            <div className="admin-nav-section-title">Governance</div>
            <Link
              href="/admin/users/admins"
              className={`admin-nav-link ${isActive('/admin/users/admins') ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg
                className="admin-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Admin Management</span>
            </Link>
            <Link
              href="/admin/roles-permissions"
              className={`admin-nav-link ${isActive('/admin/roles-permissions') ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg
                className="admin-nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Roles &amp; Permissions</span>
            </Link>
            <Link
              href="/admin/security"
              className={`admin-nav-link ${isActive('/admin/security') ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg
                className="admin-nav-icon"
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
              className={`admin-nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg
                className="admin-nav-icon"
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
          </>
        )}

        {/* ACCOUNT */}
        <div className="admin-nav-section-title">Account</div>
        <Link
          href="/admin/profile"
          className={`admin-nav-link ${isActive('/admin/profile') ? 'active' : ''}`}
          onClick={onClose}
        >
          <svg
            className="admin-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Sidebar User Identity & Sign Out Section */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user-card">
          <Link
            href="/admin/profile"
            className="admin-sidebar-user-link"
            onClick={onClose}
            title="View Profile"
          >
            <div className={`admin-sidebar-avatar ${isSuperAdmin ? 'spadmin' : ''}`}>
              {initials}
            </div>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">{displayName}</span>
              <span className="admin-sidebar-user-role">
                {isSuperAdmin ? 'Super Admin' : user?.role || 'Admin'}
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
