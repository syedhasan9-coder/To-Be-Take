'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BotanicalArtwork } from '@/components/BotanicalArtwork';
import { useCustomer } from '@/components/customer/CustomerContext';
import { customerApi } from '@/lib/customer-api';
import { sanitizeRedirectUrl } from '@/lib/auth-routing';

interface LoginFormData {
  identifier: string;
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
  sellerRedirectPrompt?: boolean;
  adminRedirectPrompt?: boolean;
}

const initialFormState: LoginFormData = {
  identifier: '',
  password: '',
};

export default function UserLoginPage(): React.ReactElement {
  const router = useRouter();
  const { login: customerLogin, isAuthenticated, isInitialized } = useCustomer();
  const [formData, setFormData] = useState<LoginFormData>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // If already authenticated customer, redirect to intended page
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const intent = urlParams.get('intent');
      const redirectParam = urlParams.get('redirect');

      if (intent === 'checkout' || redirectParam === '/checkout') {
        router.push('/checkout');
        return;
      }
      if (intent === 'buy_now') {
        router.push('/checkout');
        return;
      }
      if (intent === 'add_to_cart') {
        const target = sanitizeRedirectUrl(redirectParam, '/cart');
        router.push(target);
        return;
      }
      if (intent === 'wishlist') {
        const productId = urlParams.get('productId');
        const target = sanitizeRedirectUrl(redirectParam, productId ? `/products/${productId}` : '/');
        router.push(target);
        return;
      }
      const targetUrl = sanitizeRedirectUrl(redirectParam, '/');
      router.push(targetUrl);
    }
  }, [isAuthenticated, isInitialized, router]);

  // Validate single field
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'identifier':
        if (!value.trim()) return 'Username or email is required.';
        if (value.trim().length < 3) return 'Username or email must be at least 3 characters.';
        return undefined;

      case 'password':
        if (!value) return 'Password is required.';
        return undefined;

      default:
        return undefined;
    }
  };

  // Handle input changes and clear field-specific errors
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors] || errors.general || errors.sellerRedirectPrompt || errors.adminRedirectPrompt) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        general: undefined,
        sellerRedirectPrompt: false,
        adminRedirectPrompt: false,
      }));
    }
  };

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    const identifierError = validateField('identifier', formData.identifier);
    const passwordError = validateField('password', formData.password);

    if (identifierError) newErrors.identifier = identifierError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        identifier: formData.identifier.trim(),
        password: formData.password,
        portal: 'user',
        requiredRole: 'CUST',
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result.message || '';
        if (msg.includes('Seller') || msg.includes('VENDOR')) {
          setErrors({
            general: 'This account is registered as a Seller/Merchant. Please sign in via the Seller Portal.',
            sellerRedirectPrompt: true,
          });
        } else if (msg.includes('Admin') || msg.includes('Administrator') || msg.includes('SPADMIN')) {
          setErrors({
            general: 'This account is registered as an Administrator. Please sign in via the Admin Portal.',
            adminRedirectPrompt: true,
          });
        } else if (response.status === 401 || response.status === 403) {
          setErrors({
            general: result.message || 'Invalid username/email or password.',
          });
        } else if (response.status === 400) {
          if (Array.isArray(result.message)) {
            setErrors({ general: result.message.join('. ') });
          } else {
            setErrors({ general: result.message || 'Invalid login credentials provided.' });
          }
        } else {
          setErrors({
            general: result.message || 'An error occurred during login. Please try again.',
          });
        }
        return;
      }

      if (result.success && result.data) {
        if (result.data.roleCode !== 'CUST') {
          if (result.data.roleCode === 'VENDOR') {
            setErrors({
              general: 'This account is registered as a Seller/Merchant. Please sign in via the Seller Portal.',
              sellerRedirectPrompt: true,
            });
          } else if (result.data.roleCode === 'ADMIN' || result.data.roleCode === 'SPADMIN') {
            setErrors({
              general: 'This account is registered as an Administrator. Please sign in via the Admin Portal.',
              adminRedirectPrompt: true,
            });
          } else {
            setErrors({
              general: 'Access denied. Customer account required.',
            });
          }
          return;
        }

        const customerUser = {
          id: result.data.id,
          username: result.data.username,
          email: result.data.email,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          role: result.data.role || 'Buyer',
          roleCode: result.data.roleCode || 'CUST',
          phone: result.data.phone || undefined,
        };

        const token = result.data.token || result.data.id;

        // Immediate React Auth Context Update + Persistent Storage + Guest Cart Merge
        await customerLogin(token, customerUser);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tobetake_auth_user', JSON.stringify(customerUser));
          sessionStorage.setItem('tobetake_customer_user', JSON.stringify(customerUser));
          sessionStorage.setItem('tobetake_customer_token', token);
        }

        // Resume guest intent action if present
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const intent = urlParams.get('intent');
          const productId = urlParams.get('productId');
          const quantity = Math.max(1, Number(urlParams.get('quantity') || 1));
          const redirectParam = urlParams.get('redirect');

          if (intent === 'add_to_cart' && productId) {
            try {
              await customerApi.addToCart(productId, quantity);
            } catch (err) {
              console.warn('Auto-resumed add_to_cart error:', err);
            }
            const target = sanitizeRedirectUrl(redirectParam, '/cart');
            router.push(target);
            return;
          }

          if (intent === 'buy_now') {
            if (productId) {
              try {
                await customerApi.addToCart(productId, quantity);
              } catch (err) {
                console.warn('Auto-resumed buy_now error:', err);
              }
            }
            router.push('/checkout');
            return;
          }

          if (intent === 'wishlist' && productId) {
            try {
              await customerApi.toggleWishlist(productId);
            } catch (err) {
              console.warn('Auto-resumed wishlist error:', err);
            }
            const target = sanitizeRedirectUrl(redirectParam, `/products/${productId}`);
            router.push(target);
            return;
          }

          if (intent === 'checkout' || redirectParam === '/checkout') {
            router.push('/checkout');
            return;
          }

          const targetUrl = sanitizeRedirectUrl(redirectParam, '/');
          router.push(targetUrl);
          return;
        }

        router.push('/');
      }
    } catch (err) {
      console.error('Network error during user login:', err);
      setErrors({
        general:
          'Unable to connect to the server. Please check your network connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0.5rem 0' }}>
      {/* Top Auth Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/" className="back-nav-link">
            ← Back to Marketplace
          </Link>
          <span style={{ color: 'var(--border-medium, #dcd5c7)', fontSize: '0.875rem' }}>|</span>
          <Link href="/login" className="back-nav-link">
            Back to Sign In Options
          </Link>
        </div>
      </div>

      {/* Main Split Authentication Layout */}
      <div className="auth-split-wrapper">
        {/* Left Branded Deep Forest Green Panel */}
        <aside className="auth-sidebar" aria-label="Buyer Account Overview">
          {/* Background botanical artwork */}
          <BotanicalArtwork />

          <div className="auth-sidebar-inner">
            <div>
              <div className="auth-sidebar-brand">
                <div className="auth-sidebar-logo-mark" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 22V12H15V22"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="auth-sidebar-logo">To Be Take</span>
              </div>

              <div className="auth-portal-tag">Buyer Account</div>

              <h2 className="auth-sidebar-title">Shop &amp; Discover.</h2>
              <p className="auth-sidebar-desc">
                Explore verified stores, discover unique products, and enjoy safe checkout on To Be
                Take.
              </p>

              <ul className="auth-sidebar-features">
                <li>
                  <span className="bullet">✓</span> Verified marketplace stores
                </li>
                <li>
                  <span className="bullet">✓</span> Safe &amp; secure Pakistani checkout (COD &amp; Raast)
                </li>
                <li>
                  <span className="bullet">✓</span> Real-time order tracking with nationwide couriers
                </li>
              </ul>
            </div>

            <div className="auth-sidebar-footer">
              <p>© {new Date().getFullYear()} To Be Take • Marketplace Platform</p>
            </div>
          </div>
        </aside>

        {/* Right Form Area */}
        <section className="auth-content" aria-label="Buyer Login Form">
          <div className="auth-header">
            <h1 className="auth-title">Buyer Sign In</h1>
            <p className="auth-subtitle">
              Enter your username or email address to access your shopping account, orders, and saved addresses.
            </p>
          </div>

          {/* General error message banner */}
          {errors.general && (
            <div className="general-error-banner" role="alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              <div>
                <span>{errors.general}</span>
                {errors.sellerRedirectPrompt && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link
                      href="/login/seller"
                      style={{
                        color: '#d4a34b',
                        fontWeight: 700,
                        textDecoration: 'underline',
                      }}
                    >
                      Go to Seller Portal Sign In →
                    </Link>
                  </div>
                )}
                {errors.adminRedirectPrompt && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link
                      href="/login/admin"
                      style={{
                        color: '#d4a34b',
                        fontWeight: 700,
                        textDecoration: 'underline',
                      }}
                    >
                      Go to Admin Portal Sign In →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {/* Username or Email */}
              <div className="form-group full-width">
                <label htmlFor="identifier" className="form-label">
                  Username or Account Email <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="Enter username or email address"
                  className={`form-input ${errors.identifier ? 'input-error' : ''}`}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                  autoComplete="username"
                  disabled={isSubmitting}
                />
                {errors.identifier && (
                  <span id="identifier-error" className="error-message" role="alert">
                    {errors.identifier}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="form-group full-width">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" className="form-label">
                    Password <span className="required-indicator">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: '0.8125rem', color: '#14291f', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span id="password-error" className="error-message" role="alert">
                    {errors.password}
                  </span>
                )}
              </div>
            </div>

            {/* Form submission actions */}
            <div style={{ marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as Buyer →</span>
                )}
              </button>
            </div>

            {/* Additional helper navigation */}
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Don&apos;t have an account yet?</span>
              <Link
                href="/register/user"
                style={{
                  fontWeight: 600,
                  color: 'var(--color-forest-800)',
                  textDecoration: 'none',
                }}
              >
                Create Buyer Account →
              </Link>
            </div>

            {/* Other Portal Access Links (Subtle and non-intrusive) */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                background: '#f4f1eb',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#526359',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span>
                Are you a merchant?{' '}
                <Link href="/login/seller" style={{ color: '#14291f', fontWeight: 700, textDecoration: 'none' }}>
                  Seller Login
                </Link>
              </span>
              <span style={{ color: '#ccc' }}>|</span>
              <span>
                Marketplace Admin?{' '}
                <Link href="/login/admin" style={{ color: '#14291f', fontWeight: 700, textDecoration: 'none' }}>
                  Admin Login
                </Link>
              </span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
