import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import '../styles/customer.css';

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
      <body>{children}</body>
    </html>
  );
}
