import React from 'react';
import Link from 'next/link';

export default function HomePage(): React.ReactElement {
  return (
    <div className="home-container">
      {/* Hero banner */}
      <section className="hero-banner-card" aria-label="Welcome Hero">
        <div className="badge">
          <span className="badge-dot" />
          <span>Your marketplace platform</span>
        </div>
        <h1 className="hero-title">To Be Take</h1>
        <p className="hero-subtitle">
          Welcome to To Be Take. Get started by choosing your account type.
        </p>
      </section>

      {/* Registration portals */}
      <section aria-label="Account Registration Options">
        <div className="portal-grid">
          {/* Buyer card */}
          <div className="card portal-card portal-card-user">
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span className="portal-tag">For Customers &amp; Buyers</span>
              </div>
              <h2 className="card-title">Buyer Registration</h2>
              <p className="card-description">Create your customer account and start shopping.</p>

              <ul className="card-feature-list">
                <li>
                  <span className="bullet">✓</span> Discover verified stores &amp; products
                </li>
                <li>
                  <span className="bullet">✓</span> Fast, safe &amp; secure checkout
                </li>
                <li>
                  <span className="bullet">✓</span> Real-time order tracking &amp; history
                </li>
              </ul>
            </div>

            <Link href="/register/user" className="btn-primary" style={{ textAlign: 'center' }}>
              Register as Buyer
            </Link>
          </div>

          {/* Seller card */}
          <div className="card portal-card portal-card-seller">
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span className="portal-tag">For Vendors &amp; Sellers</span>
              </div>
              <h2 className="card-title">Seller Registration</h2>
              <p className="card-description">Create your seller account and get started.</p>

              <ul className="card-feature-list">
                <li>
                  <span className="bullet">✓</span> Store catalog &amp; inventory management
                </li>
                <li>
                  <span className="bullet">✓</span> Order fulfillment &amp; customer tracking
                </li>
                <li>
                  <span className="bullet">✓</span> Real-time sales &amp; revenue analytics
                </li>
              </ul>
            </div>

            <Link href="/register/seller" className="btn-seller" style={{ textAlign: 'center' }}>
              Register as Seller
            </Link>
          </div>

          {/* Admin card */}
          <div className="card portal-card portal-card-admin">
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span className="portal-tag">Platform Operations</span>
              </div>
              <h2 className="card-title">Admin Registration</h2>
              <p className="card-description">Create an administrator account.</p>

              <ul className="card-feature-list">
                <li>
                  <span className="bullet">✓</span> Platform settings &amp; governance controls
                </li>
                <li>
                  <span className="bullet">✓</span> Merchant verification &amp; access management
                </li>
                <li>
                  <span className="bullet">✓</span> System health &amp; platform monitoring
                </li>
              </ul>
            </div>

            <Link href="/register/admin" className="btn-admin" style={{ textAlign: 'center' }}>
              Register as Admin
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
