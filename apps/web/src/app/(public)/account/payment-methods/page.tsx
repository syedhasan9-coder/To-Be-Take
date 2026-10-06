'use client';

import React from 'react';

export default function PaymentMethodsPage(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          Payment Methods
        </h2>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your preferred Pakistani payment options for seamless one-click checkouts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* COD Card */}
        <div style={{ background: '#ffffff', border: '1.5px solid #14291f', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(20, 41, 31, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💵</span>
            <span style={{ background: '#e6f4ec', color: '#196338', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
              ✓ Default
            </span>
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.25rem' }}>
            Cash on Delivery (COD)
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#526359', margin: 0 }}>
            Pay in cash to courier rider upon doorstep package inspection across Pakistan.
          </p>
        </div>

        {/* JazzCash / EasyPaisa Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <span style={{ background: '#f8f5ee', color: '#526359', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
              Instant Wallet
            </span>
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.25rem' }}>
            JazzCash & Easypaisa
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#526359', margin: 0 }}>
            Instant digital wallet payments supported directly via checkout.
          </p>
        </div>

        {/* Raast SBP Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span style={{ background: '#f8f5ee', color: '#526359', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
              State Bank of Pakistan
            </span>
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.25rem' }}>
            Raast Instant Payment
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#526359', margin: 0 }}>
            Zero-fee instant bank transfers via State Bank of Pakistan Raast ID.
          </p>
        </div>
      </div>
    </div>
  );
}
