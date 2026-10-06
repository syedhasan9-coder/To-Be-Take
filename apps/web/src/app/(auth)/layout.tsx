import React from 'react';
import type { Metadata } from 'next';
import { CustomerProvider } from '@/components/customer/CustomerContext';

export const metadata: Metadata = {
  title: 'Authentication | To Be Take Marketplace',
  description: 'Sign in to access your To Be Take account or merchant workspace.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <CustomerProvider>
      <div
        className="auth-portal-shell"
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAF7F2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <main>{children}</main>
      </div>
    </CustomerProvider>
  );
}
