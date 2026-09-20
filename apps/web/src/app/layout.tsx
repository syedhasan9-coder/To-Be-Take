import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'To Be Take — Marketplace Platform',
  description: 'To Be Take — Multi-Vendor Marketplace & Platform Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="header-inner">
            <Link href="/" className="brand-link" aria-label="To Be Take Home">
              <span className="brand-badge-dot" />
              <span>To Be Take</span>
            </Link>

            <nav className="header-nav" aria-label="Main Navigation">
              <Link href="/register/user" className="nav-link">
                Buyer Signup
              </Link>
              <Link href="/register/seller" className="nav-link">
                Seller Registration
              </Link>
              <Link href="/register/admin" className="nav-link">
                Admin Registration
              </Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="footer">
          <p>© {new Date().getFullYear()} To Be Take. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
