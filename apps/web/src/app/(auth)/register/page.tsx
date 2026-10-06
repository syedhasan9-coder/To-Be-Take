import React from 'react';
import Link from 'next/link';

export default function RegisterSelectionPage(): React.ReactElement {
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
          <span>Account Registration</span>
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
          Create Your Account
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
          Select the account type that matches your role to begin your registration.
        </p>
      </div>

      {/* Role Selection Portals Grid */}
      <div className="portal-grid-3">
        {/* Buyer / Customer card */}
        <div className="card portal-card portal-card-user">
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="portal-tag">Buyer / Customer</span>
            </div>
            <h2 className="card-title">Buyer / Customer</h2>
            <p className="card-description">
              Create your customer account to browse verified stores and purchase products safely.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Shop products &amp; exclusive collections
              </li>
              <li>
                <span className="bullet">✓</span> Track orders &amp; shipments in real-time
              </li>
              <li>
                <span className="bullet">✓</span> Manage customer profile &amp; delivery addresses
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/register/user"
              className="btn-primary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Create Buyer Account →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link
                href="/login/user"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In
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
              Open your merchant store to showcase your catalog and expand your business reach.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Manage storefront &amp; store profile
              </li>
              <li>
                <span className="bullet">✓</span> Manage products &amp; inventory levels
              </li>
              <li>
                <span className="bullet">✓</span> Manage and fulfill customer orders
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/register/seller"
              className="btn-seller"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Create Seller Account →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link
                href="/login/seller"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Admin / Super Admin card */}
        <div className="card portal-card portal-card-admin">
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="portal-tag">Platform Operations</span>
            </div>
            <h2 className="card-title">Admin / Super Admin</h2>
            <p className="card-description">
              Platform management and governance access for authorized administrators.
            </p>

            <ul className="card-feature-list">
              <li>
                <span className="bullet">✓</span> Platform administration &amp; settings
              </li>
              <li>
                <span className="bullet">✓</span> Merchant &amp; access role management
              </li>
              <li>
                <span className="bullet">✓</span> System &amp; platform security controls
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/register/admin"
              className="btn-admin"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Create Admin Account →
            </Link>
            <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link
                href="/login/admin"
                style={{
                  color: 'var(--color-forest-800)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Already have an account footer */}
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
          Already have an account?
        </span>
        <Link
          href="/login"
          style={{
            fontWeight: 600,
            color: 'var(--color-forest-800)',
            textDecoration: 'none',
          }}
        >
          Sign In to Your Account →
        </Link>
      </div>
    </div>
  );
}
