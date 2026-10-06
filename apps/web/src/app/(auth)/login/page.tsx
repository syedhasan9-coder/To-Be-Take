import React from 'react';
import Link from 'next/link';

export default function LoginSelectionPage(): React.ReactElement {
  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Top back navigation */}
      <Link href="/" className="back-nav-link">
        ← Back to Home
      </Link>

      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="badge">
          <span className="badge-dot" />
          <span>Account Authentication</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Choose how you want to sign in to access your To Be Take workspace.
        </p>
      </div>

      {/* Role Sign In Options Grid */}
      <div className="portal-grid-3">
        {/* Admin / Super Admin card */}
        <div className="card portal-card portal-card-admin">
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="portal-tag">Platform Operations</span>
            </div>
            <h2 className="card-title">Admin / Super Admin</h2>
            <p className="card-description">
              Sign in to platform operations, manage merchant requests, and configure settings.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Platform dashboard &amp; system health
              </li>
              <li>
                <span className="bullet">✓</span> User &amp; merchant management
              </li>
              <li>
                <span className="bullet">✓</span> Governance &amp; access control
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/login/admin"
              className="btn-admin"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Sign In as Admin →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Need to register? </span>
              <Link
                href="/register/admin"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Create Admin Account
              </Link>
            </div>
          </div>
        </div>

        {/* Buyer / Customer card */}
        <div className="card portal-card portal-card-user">
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="portal-tag">Buyer / Customer</span>
            </div>
            <h2 className="card-title">Buyer / Customer</h2>
            <p className="card-description">
              Customer authentication portal for shopping, active order tracking, and account
              history.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Order tracking &amp; purchase history
              </li>
              <li>
                <span className="bullet">✓</span> Saved shipping &amp; billing details
              </li>
              <li>
                <span className="bullet">✓</span> Wishlist &amp; customer notifications
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/login/user"
              className="btn-primary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Sign In as Buyer →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Need to register? </span>
              <Link
                href="/register/user"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Create Buyer Account
              </Link>
            </div>
          </div>
        </div>

        {/* Seller / Vendor card */}
        <div className="card portal-card portal-card-seller">
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="portal-tag">Seller / Vendor</span>
            </div>
            <h2 className="card-title">Seller / Vendor</h2>
            <p className="card-description">
              Vendor portal for managing product listings, fulfilling orders, and monitoring sales.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Inventory &amp; store catalog management
              </li>
              <li>
                <span className="bullet">✓</span> Order dispatch &amp; fulfillment queue
              </li>
              <li>
                <span className="bullet">✓</span> Revenue analytics &amp; store metrics
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/login/seller"
              className="btn-seller"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Sign In as Seller →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Need to register? </span>
              <Link
                href="/register/seller"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Create Seller Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Don't have an account footer */}
      <div
        style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          padding: '1.5rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
          Don&apos;t have an account yet?
        </span>
        <Link
          href="/register"
          style={{
            fontWeight: 600,
            color: 'var(--color-forest-800)',
            textDecoration: 'none',
          }}
        >
          Create an Account →
        </Link>
      </div>
    </div>
  );
}
