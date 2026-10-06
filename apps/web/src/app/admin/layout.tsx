'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  department?: string | null;
  designation?: string | null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tobetake_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.roleCode === 'ADMIN' || parsed.roleCode === 'SPADMIN') {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="spinner" style={{ marginRight: '0.75rem' }} />
          <span>Loading Administrator Platform...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, display authentication required card
  if (!user) {
    return (
      <div className="admin-unauth-container">
        <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '1rem' }}>
          <Link href="/" className="back-nav-link">
            ← Back to Marketplace
          </Link>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-cream)',
                border: '1px solid var(--border-medium)',
                margin: '0 auto 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-forest-800)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Administrative Authentication Required
            </h1>
            <p className="card-description" style={{ marginBottom: '1.75rem' }}>
              You must be authenticated with valid Super Admin or Admin credentials to access the
              platform management portal.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/login/admin"
                className="btn-admin"
                style={{ minWidth: '180px', textAlign: 'center' }}
              >
                Sign In to Admin Portal →
              </Link>
              <Link
                href="/"
                className="btn-secondary"
                style={{ minWidth: '140px', textAlign: 'center' }}
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        userRoleCode={user.roleCode}
      />

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Bar */}
        <AdminTopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} user={user} />

        {/* Dynamic Page Content Scrollable Area */}
        <div className="admin-content-scroll">
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
