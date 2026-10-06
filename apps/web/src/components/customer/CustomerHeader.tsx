'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer } from './CustomerContext';
import { customerApi } from '../../lib/customer-api';

export function CustomerHeader(): React.ReactElement {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    logout,
    cartCount,
    wishlistCount,
    unreadNotificationsCount,
  } = useCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customerApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchQuery.trim()) query.append('search', searchQuery.trim());
    if (selectedCategory) query.append('categorySlug', selectedCategory);
    router.push(`/products?${query.toString()}`);
  };

  return (
    <header className="customer-main-header">
      {/* 1. Top Announcement Bar */}
      <div className="customer-top-bar">
        <div className="top-bar-container">
          <div className="top-bar-left">
            <span className="top-bar-leaf-icon">🌿</span>
            <span className="top-bar-text">
              Free nationwide delivery on orders above <strong>Rs. 3,000</strong> across Pakistan
            </span>
          </div>
          <div className="top-bar-right">
            <span className="top-bar-badge">🇵🇰 100% Authentic Pakistani Goods</span>
            <Link href="/login/seller" className="top-bar-link">
              Seller Portal
            </Link>
            <span className="top-bar-sep">|</span>
            <Link href="/login/admin" className="top-bar-link">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="customer-navbar">
        <div className="navbar-container">
          {/* Logo Brand */}
          <Link href="/" className="customer-brand" aria-label="ToBeTake Marketplace">
            <div className="brand-leaf-logo">
              <svg viewBox="0 0 32 32" fill="none" className="brand-leaf-svg">
                <path
                  d="M16 2C8 6 4 14 6 22C8 28 14 30 16 30C18 30 24 28 26 22C28 14 24 6 16 2Z"
                  fill="#1C3D2E"
                />
                <path
                  d="M16 2V30M16 10L22 14M16 16L10 19M16 22L21 25"
                  stroke="#D4A34B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">ToBeTake</span>
              <span className="brand-sub">Curated Marketplace</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form className="customer-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-category-select">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter Category"
              >
                <option value="">All Categories</option>
                {categoriesList.length > 0 ? (
                  categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ceramics-tableware">Multan Pottery</option>
                    <option value="botanical-skincare">Swat Botanicals</option>
                    <option value="electronics-gadgets">Electronics & Gadgets</option>
                    <option value="home-living">Home & Living</option>
                    <option value="aromatherapy-oils">Essential Oils</option>
                  </>
                )}
              </select>
              <span className="select-arrow">▾</span>
            </div>
            <div className="search-input-wrap">
              <input
                type="text"
                placeholder="Search Multan ceramics, Swat oils, electronics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Marketplace"
              />
              <button type="submit" className="search-submit-btn" aria-label="Submit Search">
                <svg viewBox="0 0 20 20" fill="currentColor" className="search-icon">
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick Action Icons */}
          <div className="customer-nav-actions">
            {/* Wishlist */}
            <Link href="/wishlist" className="action-icon-btn" aria-label="Wishlist">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="action-svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
              </div>
              <span className="action-label">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="action-icon-btn" aria-label="Shopping Cart">
              <div className="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="action-svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                {cartCount > 0 && <span className="badge-count badge-primary">{cartCount}</span>}
              </div>
              <span className="action-label">Cart</span>
            </Link>

            {/* Account Menu */}
            <div className="account-dropdown-wrapper" ref={accountRef}>
              <button
                type="button"
                className="action-icon-btn account-trigger"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-expanded={accountMenuOpen}
                aria-label="User Account Menu"
              >
                <div className="icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="action-svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  {unreadNotificationsCount > 0 && <span className="badge-dot" />}
                </div>
                <span className="action-label">
                  {isAuthenticated ? (user?.firstName || 'Account') : 'Sign In'}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown-panel animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      <div className="dropdown-user-header">
                        <div className="user-avatar-initials">
                          {user?.firstName?.[0] || 'U'}
                          {user?.lastName?.[0] || ''}
                        </div>
                        <div className="user-info-text">
                          <p className="user-full-name">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="user-email">{user?.email}</p>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <Link href="/account" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>📊 Dashboard</span>
                      </Link>
                      <Link href="/account/orders" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>📦 My Orders</span>
                      </Link>
                      <Link href="/account/addresses" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>📍 Delivery Addresses</span>
                      </Link>
                      <Link href="/account/notifications" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>🔔 Notifications</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="menu-badge">{unreadNotificationsCount}</span>
                        )}
                      </Link>
                      <Link href="/account/reviews" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>⭐ My Reviews</span>
                      </Link>
                      <Link href="/account/profile" className="dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                        <span>⚙️ Settings & Security</span>
                      </Link>
                      <div className="dropdown-divider" />
                      <button
                        type="button"
                        className="dropdown-item dropdown-logout"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logout();
                        }}
                      >
                        <span>🚪 Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="dropdown-auth-prompt">
                      <p className="auth-prompt-title">Welcome to ToBeTake</p>
                      <p className="auth-prompt-sub">Log in to track orders and save wishlist items</p>
                      <Link
                        href="/login/user"
                        className="btn-primary auth-btn"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Sign In / Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Bar / Quick Links */}
      <nav className="customer-category-ribbon">
        <div className="ribbon-container">
          <Link href="/products" className="ribbon-link ribbon-all">
            <span className="ribbon-icon">✨</span> All Products
          </Link>
          <Link href="/products?categorySlug=ceramics-tableware" className="ribbon-link">
            🏺 Multan Pottery
          </Link>
          <Link href="/products?categorySlug=botanical-skincare" className="ribbon-link">
            🍃 Swat Botanicals
          </Link>
          <Link href="/products?categorySlug=aromatherapy-oils" className="ribbon-link">
            💧 Pure Oils
          </Link>
          <Link href="/products?categorySlug=electronics-gadgets" className="ribbon-link">
            🎧 Audio & Tech
          </Link>
          <Link href="/products?categorySlug=home-living" className="ribbon-link">
            🏡 Home & Living
          </Link>
          <Link href="/products?sort=discount" className="ribbon-link ribbon-deal">
            🔥 Flash Deals
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-brand">ToBeTake Pakistan</span>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation"
              >
                ✕
              </button>
            </div>
            <div className="drawer-body">
              <Link href="/products" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                🛍️ Browse All Products
              </Link>
              <Link href="/products?categorySlug=ceramics-tableware" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                🏺 Multan Blue Pottery
              </Link>
              <Link href="/products?categorySlug=botanical-skincare" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                🍃 Swat Botanical Skincare
              </Link>
              <Link href="/products?categorySlug=aromatherapy-oils" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                💧 Pure Essential Oils
              </Link>
              <Link href="/products?categorySlug=electronics-gadgets" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                ⚡ Electronics & Audio
              </Link>
              <div className="drawer-divider" />
              {isAuthenticated ? (
                <>
                  <Link href="/account" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                    📊 Customer Dashboard
                  </Link>
                  <Link href="/account/orders" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <Link href="/wishlist" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                    ❤️ Wishlist ({wishlistCount})
                  </Link>
                  <Link href="/cart" className="drawer-item" onClick={() => setMobileMenuOpen(false)}>
                    🛒 Shopping Cart ({cartCount})
                  </Link>
                  <button
                    type="button"
                    className="drawer-item text-danger"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login/user" className="btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
