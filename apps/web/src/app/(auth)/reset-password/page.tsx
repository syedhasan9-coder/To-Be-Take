'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push('/login/user');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '460px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: '0 8px 30px rgba(20, 41, 31, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔑</span>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.8rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.25rem' }}>
            Set New Password
          </h1>
          <p style={{ color: '#526359', fontSize: '0.875rem' }}>
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fdf2f2', border: '1px solid #f8c8c8', borderRadius: '10px', padding: '0.75rem 1rem', color: '#a82323', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#e6f4ec', border: '1px solid #b6e2c8', borderRadius: '12px', padding: '1.25rem', color: '#196338', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ✓ Password updated successfully! Redirecting to Sign In...
            </div>
            <Link href="/login/user" className="btn-primary" style={{ display: 'block', padding: '0.75rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: 700 }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
