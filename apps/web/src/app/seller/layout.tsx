import React from 'react';
import type { Metadata } from 'next';
import { SellerLayoutClient } from '@/components/seller/SellerLayoutClient';

export const metadata: Metadata = {
  title: 'Seller Portal | To Be Take Marketplace',
  description: 'Manage your marketplace store, catalog, inventory, orders, and earnings.',
};

export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <SellerLayoutClient>{children}</SellerLayoutClient>;
}
