'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: '0 8px 30px rgba(20, 41, 31, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔐</span>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.8rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.25rem' }}>
            Reset Your Password
          </h1>
          <p style={{ color: '#526359', fontSize: '0.875rem' }}>
            Enter your registered email and we will send you instructions to recover your ToBeTake account.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#e6f4ec', border: '1px solid #b6e2c8', borderRadius: '12px', padding: '1.25rem', color: '#196338', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              ✓ Reset instructions sent to <strong>{email}</strong>. Please check your inbox and spam folder.
            </div>
            <Link href="/login/user" className="btn-primary" style={{ display: 'block', padding: '0.75rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: 700 }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="bilal@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #dcd5c7',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              Send Reset Link
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/login/user" style={{ color: '#526359', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600 }}>
                ← Remember your password? Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
