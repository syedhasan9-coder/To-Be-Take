'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BotanicalArtwork } from '@/components/BotanicalArtwork';
import { clearStoredAuthUser, getStoredAuthUser, setStoredAuthUser } from '@/lib/api';

interface LoginFormData {
  identifier: string;
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

const initialFormState: LoginFormData = {
  identifier: '',
  password: '',
};

export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // If already authenticated as an Admin in session, redirect directly to admin dashboard
  useEffect(() => {
    try {
      const sessionStored = sessionStorage.getItem('tobetake_auth_user');
      if (sessionStored) {
        const parsed = JSON.parse(sessionStored);
        if (parsed && (parsed.roleCode === 'ADMIN' || parsed.roleCode === 'SPADMIN')) {
          router.push('/admin/dashboard');
        }
      }
    } catch {
      // Ignore
    }
  }, [router]);

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

    if (errors[name as keyof FormErrors] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
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
        portal: 'admin',
        requiredRole: 'ADMIN',
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
        if (response.status === 401 || response.status === 403) {
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
        if (result.data.roleCode !== 'SPADMIN' && result.data.roleCode !== 'ADMIN') {
          clearStoredAuthUser();
          setErrors({
            general: 'Access denied. Administrator privileges required.',
          });
          return;
        }

        const adminUser = {
          id: result.data.id,
          username: result.data.username,
          email: result.data.email,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          role: result.data.role,
          roleCode: result.data.roleCode,
          department: result.data.department ?? null,
          designation: result.data.designation ?? null,
        };

        // Store safe authenticated user details across storage layers
        setStoredAuthUser(adminUser);

        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Network error during admin login:', err);
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
        <Link
          href="/login/user"
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-forest-800)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Customer Sign In →
        </Link>
      </div>

      {/* Main Split Authentication Layout */}
      <div className="auth-split-wrapper">
        {/* Left Branded Deep Forest Green Panel */}
        <aside className="auth-sidebar" aria-label="Admin Portal Overview">
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
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="auth-sidebar-logo">To Be Take</span>
              </div>

              <div className="auth-portal-tag">Platform Administration</div>

              <h2 className="auth-sidebar-title">Admin Portal</h2>
              <p className="auth-sidebar-desc">
                Secure access for platform administrators and system management.
              </p>

              <ul className="auth-sidebar-features">
                <li>
                  <span className="bullet">✓</span> System governance &amp; platform configuration
                </li>
                <li>
                  <span className="bullet">✓</span> User management &amp; access role auditing
                </li>
                <li>
                  <span className="bullet">✓</span> Store approvals &amp; seller onboarding controls
                </li>
                <li>
                  <span className="bullet">✓</span> Platform health &amp; real-time monitoring
                </li>
              </ul>
            </div>

            <div className="auth-sidebar-footer">
              <p>To Be Take Administration Portal — Authorized personnel only</p>
            </div>
          </div>
        </aside>

        {/* Right Form Area */}
        <section className="auth-content" aria-label="Admin Login Form">
          <div className="auth-header">
            <h1 className="auth-title">Admin / Super Admin Sign In</h1>
            <p className="auth-subtitle">
              Enter your administrator credentials to access your management portal.
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
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {/* Username or Email */}
              <div className="form-group full-width">
                <label htmlFor="identifier" className="form-label">
                  Username or Work Email <span className="required-indicator">*</span>
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
                <label htmlFor="password" className="form-label">
                  Password <span className="required-indicator">*</span>
                </label>
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
                className="btn-admin"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Portal →</span>
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
              <span>Need to register a new admin?</span>
              <Link
                href="/register/admin"
                style={{
                  fontWeight: 600,
                  color: 'var(--color-forest-800)',
                  textDecoration: 'none',
                }}
              >
                Create Admin Account →
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
