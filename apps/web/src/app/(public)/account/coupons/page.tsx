'use client';

import React, { useState } from 'react';

const COUPONS = [
  {
    code: 'PAKISTAN15',
    title: '15% Off All Botanical Skincare',
    description: 'Valid on Swat Valley rosehip oils, lavender serums, and organic extracts.',
    discount: '15% OFF',
    minSpend: 'Rs. 2,000',
    validUntil: 'Dec 31, 2026',
  },
  {
    code: 'WELCOME10',
    title: '10% Welcome Discount',
    description: 'First-time customer discount across all handcrafted marketplace items.',
    discount: '10% OFF',
    minSpend: 'Rs. 1,500',
    validUntil: 'Dec 31, 2026',
  },
  {
    code: 'FREESHIP3K',
    title: 'Free Express Shipping Across Pakistan',
    description: 'Automatic free doorstep TCS & Leopards delivery on orders above Rs. 3,000.',
    discount: 'FREE DELIVERY',
    minSpend: 'Rs. 3,000',
    validUntil: 'Ongoing',
  },
];

export default function CouponsPage(): React.ReactElement {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          Available Coupons & Offers
        </h2>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Apply these promotional voucher codes during checkout for instant savings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {COUPONS.map((c) => (
          <div
            key={c.code}
            style={{
              background: '#ffffff',
              border: '1.5px dashed #d4a34b',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(20, 41, 31, 0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ background: '#fdf6e7', color: '#966b18', border: '1px solid #fed7aa', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  {c.discount}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#82948a' }}>Valid: {c.validUntil}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.35rem' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#526359', lineHeight: 1.5, margin: '0 0 1rem' }}>
                {c.description}
              </p>
            </div>

            <div style={{ borderTop: '1px dashed #e8e3d9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#82948a', display: 'block' }}>Min Order: {c.minSpend}</span>
                <strong style={{ fontSize: '0.9375rem', color: '#14291f', letterSpacing: '0.05em' }}>{c.code}</strong>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(c.code)}
                style={{
                  background: copiedCode === c.code ? '#196338' : '#14291f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {copiedCode === c.code ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
