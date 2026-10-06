'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from './SellerSidebar';
import { SellerTopBar } from './SellerTopBar';
import { getStoredAuthUser } from '@/lib/api';

interface AuthSellerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  storeName?: string | null;
  businessCategory?: string | null;
  status?: string;
}

export function SellerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<AuthSellerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = getStoredAuthUser();
      if (stored && stored.roleCode === 'VENDOR') {
        setUser(stored);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-linen, #faf8f5)',
          color: 'var(--color-forest-800, #1b4332)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Loading Merchant Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-linen, #faf8f5)',
          padding: '1.5rem',
        }}
      >
        <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(180, 83, 9, 0.1)',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1b4332' }}>
            Seller Authentication Required
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Access to this merchant workspace is restricted to verified seller accounts. Please sign in with your store credentials.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login/seller"
              className="btn-seller"
              style={{ minWidth: '160px', textAlign: 'center' }}
            >
              Sign In as Seller →
            </Link>
            <Link
              href="/"
              className="btn-secondary"
              style={{ minWidth: '140px', textAlign: 'center' }}
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout" style={{ background: 'var(--bg-linen, #faf8f5)' }}>
      {/* Sidebar */}
      <SellerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main">
        <SellerTopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        <div className="admin-content-scroll">
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
