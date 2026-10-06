'use client';

import React from 'react';
import Link from 'next/link';

export function CustomerFooter(): React.ReactElement {
  return (
    <footer className="customer-main-footer">
      {/* 1. Trust & Reassurance Badges */}
      <div className="footer-trust-strip">
        <div className="container trust-strip-inner">
          <div className="trust-badge-card">
            <div className="trust-icon-box">🌿</div>
            <div className="trust-text">
              <h4>100% Authentic Heritage</h4>
              <p>Certified Multan pottery & organic Swat botanicals</p>
            </div>
          </div>
          <div className="trust-badge-card">
            <div className="trust-icon-box">🚚</div>
            <div className="trust-text">
              <h4>Nationwide Fast Delivery</h4>
              <p>TCS & Leopards express with real-time tracking</p>
            </div>
          </div>
          <div className="trust-badge-card">
            <div className="trust-icon-box">🛡️</div>
            <div className="trust-text">
              <h4>7-Day Buyer Protection</h4>
              <p>Hassle-free returns & instant refund guarantees</p>
            </div>
          </div>
          <div className="trust-badge-card">
            <div className="trust-icon-box">💳</div>
            <div className="trust-text">
              <h4>Secure Pakistani Payments</h4>
              <p>COD, JazzCash, EasyPaisa, Raast & 1Link</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links */}
      <div className="footer-main-body">
        <div className="container footer-grid">
          {/* Col 1: Brand Ethos */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="logo-leaf">🌿</span>
              <span className="logo-text">ToBeTake</span>
            </div>
            <p className="footer-desc">
              Pakistan’s premier curated marketplace connecting master artisans, organic botanical growers, and innovative merchants directly to conscious consumers nationwide.
            </p>
            <div className="footer-contact-info">
              <p>📍 Karachi • Lahore • Islamabad • Multan</p>
              <p>📞 Helpline: +92 300 1234567</p>
              <p>✉️ support@tobetake.pk</p>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">Artisan Categories</h4>
            <ul className="footer-links">
              <li><Link href="/products?categorySlug=ceramics-tableware">Multan Blue Pottery</Link></li>
              <li><Link href="/products?categorySlug=botanical-skincare">Swat Botanical Elixirs</Link></li>
              <li><Link href="/products?categorySlug=aromatherapy-oils">Cold-Pressed Essential Oils</Link></li>
              <li><Link href="/products?categorySlug=electronics-gadgets">Smart Audio & Tech</Link></li>
              <li><Link href="/products?categorySlug=home-living">Handcrafted Sheesham Living</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Care</h4>
            <ul className="footer-links">
              <li><Link href="/account/orders">Track Your Parcel</Link></li>
              <li><Link href="/account/addresses">Shipping & Delivery Rates</Link></li>
              <li><Link href="/account/orders">Returns & Replacements</Link></li>
              <li><Link href="/wishlist">Your Wishlist</Link></li>
              <li><Link href="/account/profile">Account Settings</Link></li>
            </ul>
          </div>

          {/* Col 4: Payments & Courier Partners */}
          <div className="footer-col">
            <h4 className="footer-heading">Payment & Logistics</h4>
            <p className="footer-subtext">Supported across all 4 provinces:</p>
            <div className="payment-badges-wrap">
              <span className="pay-badge cod-badge">💵 Cash on Delivery</span>
              <span className="pay-badge jazz-badge">📱 JazzCash</span>
              <span className="pay-badge easy-badge">🟢 Easypaisa</span>
              <span className="pay-badge raast-badge">⚡ Raast SBP</span>
              <span className="pay-badge bank-badge">🏛️ 1Link IBFT</span>
            </div>
            <h4 className="footer-heading" style={{ marginTop: '1.25rem' }}>Courier Network</h4>
            <div className="courier-badges-wrap">
              <span className="courier-pill">TCS Express</span>
              <span className="courier-pill">Leopards</span>
              <span className="courier-pill">Trax</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright */}
      <div className="footer-bottom-bar">
        <div className="container bottom-bar-inner">
          <p>© {new Date().getFullYear()} ToBeTake Marketplace Pakistan. All rights reserved.</p>
          <div className="bottom-links">
            <Link href="/seller/login">Merchant Portal</Link>
            <span>•</span>
            <Link href="/admin/login">Admin Console</Link>
            <span>•</span>
            <span>Made with 🌿 in Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
