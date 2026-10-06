import React from 'react';
import { CustomerProvider } from '../../components/customer/CustomerContext';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerFooter } from '../../components/customer/CustomerFooter';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <CustomerProvider>
      <div className="public-marketplace-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FAF7F2' }}>
        <CustomerHeader />
        <main style={{ flex: 1, paddingBottom: '4rem' }}>
          {children}
        </main>
        <CustomerFooter />
        <CustomerBottomNav />
      </div>
    </CustomerProvider>
  );
}
