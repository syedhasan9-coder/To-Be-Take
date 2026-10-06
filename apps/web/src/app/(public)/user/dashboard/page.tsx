'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  status?: string;
}

export default function UserDashboardPage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tobetake_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Handle storage read error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = () => {
    try {
      sessionStorage.removeItem('tobetake_auth_user');
    } catch {
      // Handle storage removal error
    }
    setUser(null);
    router.push('/login/user');
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
        <p>Loading customer workspace...</p>
      </div>
    );
  }

  // Graceful handling of unauthenticated state
  if (!user) {
    return (
      <div style={{ maxWidth: '680px', margin: '2rem auto', padding: '1rem 0' }}>
        <Link href="/" className="back-nav-link">
          ← Back to Home
        </Link>

        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <span
              className="badge-coming-soon"
              style={{
                marginBottom: '0.75rem',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderColor: '#fecaca',
              }}
            >
              Authentication Required
            </span>
            <h1 className="card-title" style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>
              Buyer Workspace
            </h1>
            <p className="card-description" style={{ maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              You are not currently signed in. Please authenticate with your buyer credentials to
              access the workspace.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login/user"
              className="btn-primary"
              style={{ minWidth: '180px', textAlign: 'center' }}
            >
              Sign In as Buyer →
            </Link>
            <Link
              href="/"
              className="btn-secondary"
              style={{ minWidth: '160px', textAlign: 'center' }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Top Header Nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <Link href="/" className="back-nav-link" style={{ marginBottom: 0 }}>
          ← Back to Home
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary"
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Sign Out
        </button>
      </div>

      {/* Main Dashboard Welcome Card */}
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="role-badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
            {user.role || 'Buyer'}
          </span>
          <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Welcome to Buyer Workspace,{' '}
            {user.firstName ? `${user.firstName} ${user.lastName}` : 'Customer'}
          </h1>
          <p className="card-description" style={{ marginBottom: 0 }}>
            You are securely logged into your To Be Take account.
          </p>
        </div>

        {/* Account Details Summary */}
        <div
          className="success-details"
          style={{ margin: '1.5rem 0', background: 'var(--bg-cream)' }}
        >
          <div className="detail-row">
            <span className="detail-label">Username</span>
            <span className="detail-value">{user.username}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role Code</span>
            <span className="detail-value">{user.roleCode}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link href="/" className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
            Explore Marketplace
          </Link>
          <Link href="/login" className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
