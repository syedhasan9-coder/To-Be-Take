'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiResponse, BuyerUserResponse } from '@tobetake/shared-types';
import { BotanicalArtwork } from '@/components/BotanicalArtwork';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface UserRegistrationForm {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const initialFormState: UserRegistrationForm = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterUserPage(): React.ReactElement {
  const [formData, setFormData] = useState<UserRegistrationForm>(initialFormState);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registeredUser, setRegisteredUser] = useState<BuyerUserResponse | null>(null);

  // Password validation
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecialChar = /[@$!%*?&^#()_\-+=<>.,:;]/.test(formData.password);

  const criteriaMetCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  let strengthLabel = 'Weak';
  let strengthClass = 'strength-weak';

  if (criteriaMetCount >= 5) {
    strengthLabel = 'Strong';
    strengthClass = 'strength-strong';
  } else if (criteriaMetCount >= 3) {
    strengthLabel = 'Good';
    strengthClass = 'strength-good';
  } else if (criteriaMetCount >= 2) {
    strengthLabel = 'Fair';
    strengthClass = 'strength-fair';
  }

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (errors[name as keyof FormErrors] || errors.general) {
      setErrors((previous) => ({
        ...previous,
        [name]: undefined,
        general: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const cleanFirstName = formData.firstName.trim();
    if (!cleanFirstName) {
      newErrors.firstName = 'First name is required.';
    } else if (cleanFirstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters long.';
    } else if (cleanFirstName.length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters.';
    }

    const cleanLastName = formData.lastName.trim();
    if (!cleanLastName) {
      newErrors.lastName = 'Last name is required.';
    } else if (cleanLastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters long.';
    } else if (cleanLastName.length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters.';
    }

    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      newErrors.username = 'Username is required.';
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long.';
    } else if (cleanUsername.length > 30) {
      newErrors.username = 'Username cannot exceed 30 characters.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      newErrors.username =
        'Username can only contain letters, numbers, hyphens (-), and underscores (_).';
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address (e.g. user@example.com).';
    } else if (cleanEmail.length > 255) {
      newErrors.email = 'Email address cannot exceed 255 characters.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (!isPasswordValid) {
      newErrors.password =
        'Password must satisfy all security requirements listed in the checklist below.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Register buyer
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData: ApiResponse<BuyerUserResponse> = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({
            general:
              responseData.message ||
              'This username or email is already registered. Please use another one.',
          });
        } else if (response.status === 400 && Array.isArray(responseData.message)) {
          setErrors({
            general: (responseData.message as string[]).join(' '),
          });
        } else {
          setErrors({
            general:
              responseData.message ||
              'Registration could not be completed. Please review your entries.',
          });
        }
        return;
      }

      if (responseData.success && responseData.data) {
        setRegisteredUser(responseData.data);
      }
    } catch (networkError) {
      console.error('Network error during buyer registration:', networkError);
      setErrors({
        general:
          'Unable to connect to the server. Please verify the API backend is running and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for a new registration
  const handleReset = () => {
    setRegisteredUser(null);
    setFormData(initialFormState);
    setErrors({});
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0.5rem 0' }}>
      {/* Back navigation */}
      <Link href="/" className="back-nav-link">
        ← Back to To Be Take
      </Link>

      {/* Registration layout */}
      <div className="auth-split-wrapper">
        {/* Branding */}
        <aside className="auth-sidebar" aria-label="Customer Portal Overview">
          {/* Background artwork */}
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

              <span className="auth-portal-tag">Buyer Account</span>

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
                  <span className="bullet">✓</span> Safe &amp; secure checkout
                </li>
                <li>
                  <span className="bullet">✓</span> Real-time order tracking
                </li>
              </ul>
            </div>
            <div className="auth-sidebar-footer">
              <p>© {new Date().getFullYear()} To Be Take • Marketplace Platform</p>
            </div>
          </div>
        </aside>

        {/* Registration form */}
        <main className="auth-content">
          {registeredUser ? (
            /* Success screen */
            <div className="success-card">
              <div className="success-icon" aria-hidden="true">
                ✓
              </div>
              <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                Account Created Successfully
              </h2>
              <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                Your To Be Take account is ready. Here are your account details:
              </p>

              <div className="success-details">
                <div className="success-detail-row">
                  <span className="success-detail-label">Account ID:</span>
                  <span className="success-detail-value" style={{ fontFamily: 'monospace' }}>
                    {registeredUser.id}
                  </span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Full Name:</span>
                  <span className="success-detail-value">
                    {registeredUser.firstName} {registeredUser.lastName}
                  </span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Username:</span>
                  <span className="success-detail-value">{registeredUser.username}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Email:</span>
                  <span className="success-detail-value">{registeredUser.email}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Role:</span>
                  <span className="success-detail-value">Buyer</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Status:</span>
                  <span className="success-detail-value" style={{ color: '#16a34a' }}>
                    Active
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button type="button" onClick={handleReset} className="btn-primary">
                  Register Another Account
                </button>
                <Link href="/" className="btn-secondary">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            /* Registration form */
            <div>
              <header className="auth-header">
                <h1 className="auth-title">Create Your Account</h1>
                <p className="auth-subtitle">
                  Join the marketplace and start discovering products.
                </p>
              </header>

              {errors.general && (
                <div className="alert alert-error" role="alert" aria-live="polite">
                  <span aria-hidden="true">⚠</span>
                  <div>{errors.general}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Personal information */}
                <div className="form-section">
                  <h2 className="form-section-title">Personal Information</h2>
                  <div className="form-row">
                    {/* First Name */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="firstName">
                        First Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        className={`form-input ${errors.firstName ? 'has-error' : ''}`}
                        placeholder="e.g. Bruce"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                        required
                      />
                      {errors.firstName && (
                        <div id="firstName-error" className="form-error-text" role="alert">
                          {errors.firstName}
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="lastName">
                        Last Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className={`form-input ${errors.lastName ? 'has-error' : ''}`}
                        placeholder="e.g. Wayne"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.lastName)}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                        required
                      />
                      {errors.lastName && (
                        <div id="lastName-error" className="form-error-text" role="alert">
                          {errors.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account information */}
                <div className="form-section">
                  <h2 className="form-section-title">Account Information</h2>
                  <div className="form-row">
                    {/* Username */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="username">
                        Username <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className={`form-input ${errors.username ? 'has-error' : ''}`}
                        placeholder="e.g. bruce_wayne"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={errors.username ? 'username-error' : 'username-hint'}
                        required
                      />
                      {errors.username ? (
                        <div id="username-error" className="form-error-text" role="alert">
                          {errors.username}
                        </div>
                      ) : (
                        <div id="username-hint" className="form-hint-text">
                          3-30 letters, numbers, hyphens (-), or underscores (_)
                        </div>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">
                        Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input ${errors.email ? 'has-error' : ''}`}
                        placeholder="e.g. bruce@wayne.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        required
                      />
                      {errors.email && (
                        <div id="email-error" className="form-error-text" role="alert">
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    {/* Password */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="password">
                        Password <span className="required">*</span>
                      </label>
                      <div className="form-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className={`form-input ${errors.password ? 'has-error' : ''}`}
                          placeholder="Enter strong password"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(errors.password)}
                          aria-describedby={errors.password ? 'password-error' : undefined}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            {showPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      {errors.password && (
                        <div id="password-error" className="form-error-text" role="alert">
                          {errors.password}
                        </div>
                      )}

                      {/* Password strength */}
                      {formData.password && (
                        <div className="password-meter" aria-live="polite">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '0.25rem',
                              fontSize: '0.75rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Password Strength:
                            </span>
                            <span style={{ fontWeight: 600 }}>{strengthLabel}</span>
                          </div>
                          <div className="password-meter-bar">
                            <div className={`password-meter-progress ${strengthClass}`}></div>
                          </div>
                          <ul className="password-checklist">
                            <li className={hasMinLength ? 'met' : ''}>
                              <span>{hasMinLength ? '✓' : '○'}</span> At least 8 characters
                            </li>
                            <li className={hasUppercase ? 'met' : ''}>
                              <span>{hasUppercase ? '✓' : '○'}</span> 1 uppercase letter
                            </li>
                            <li className={hasLowercase ? 'met' : ''}>
                              <span>{hasLowercase ? '✓' : '○'}</span> 1 lowercase letter
                            </li>
                            <li className={hasNumber ? 'met' : ''}>
                              <span>{hasNumber ? '✓' : '○'}</span> 1 number
                            </li>
                            <li className={hasSpecialChar ? 'met' : ''}>
                              <span>{hasSpecialChar ? '✓' : '○'}</span> 1 special symbol
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="confirmPassword">
                        Confirm Password <span className="required">*</span>
                      </label>
                      <div className="form-input-wrapper">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          className={`form-input ${errors.confirmPassword ? 'has-error' : ''}`}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          aria-describedby={
                            errors.confirmPassword ? 'confirmPassword-error' : undefined
                          }
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            {showConfirmPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                          <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div id="confirmPassword-error" className="form-error-text" role="alert">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit actions */}
                <div
                  style={{
                    marginTop: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="badge-dot"
                          style={{ background: '#ffffff', boxShadow: 'none' }}
                        ></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                  <Link href="/" className="btn-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
