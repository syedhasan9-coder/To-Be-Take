'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCustomer } from './CustomerContext';

export function CustomerBottomNav(): React.ReactElement {
  const pathname = usePathname();
  const { cartCount, isAuthenticated } = useCustomer();

  return (
    <nav className="customer-bottom-nav" aria-label="Mobile Navigation">
      <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Home</span>
      </Link>

      <Link href="/products" className={`bottom-nav-item ${pathname.startsWith('/products') || pathname.startsWith('/category') ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🛍️</span>
        <span className="bottom-nav-label">Shop</span>
      </Link>

      <Link href="/cart" className={`bottom-nav-item ${pathname === '/cart' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">
          🛒
          {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
        </span>
        <span className="bottom-nav-label">Cart</span>
      </Link>

      <Link href="/account/orders" className={`bottom-nav-item ${pathname.startsWith('/account/orders') || pathname.startsWith('/orders') ? 'active' : ''}`}>
        <span className="bottom-nav-icon">📦</span>
        <span className="bottom-nav-label">Orders</span>
      </Link>

      <Link
        href={isAuthenticated ? '/account' : '/login/user'}
        className={`bottom-nav-item ${pathname.startsWith('/account') && !pathname.startsWith('/account/orders') ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">👤</span>
        <span className="bottom-nav-label">{isAuthenticated ? 'Account' : 'Sign In'}</span>
      </Link>
    </nav>
  );
}
