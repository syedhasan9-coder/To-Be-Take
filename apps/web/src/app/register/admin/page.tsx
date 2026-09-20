'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BotanicalArtwork } from '@/components/BotanicalArtwork';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
}

interface RegisterAdminFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  departmentId: string;
  designation: string;
}

interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  designation: string;
  status: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  departmentId?: string;
  designation?: string;
  general?: string;
}

const initialFormState: RegisterAdminFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  departmentId: '',
  designation: '',
};

export default function RegisterAdminPage(): React.ReactElement {
  const [formData, setFormData] = useState<RegisterAdminFormData>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState<boolean>(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  const loadDepartments = useCallback(async () => {
    setIsLoadingDepartments(true);
    setDepartmentError(null);
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setDepartments(result.data);
        if (result.data.length > 0) {
          setFormData((prev) => {
            if (!prev.departmentId) {
              return {
                ...prev,
                departmentId: String(result.data[0].id),
              };
            }
            return prev;
          });
        }
      } else {
        throw new Error('Invalid department response format');
      }
    } catch (err) {
      console.error('Error loading departments from API:', err);
      setDepartmentError('Unable to load the departments list. Please verify your connection.');
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  // Load departments
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Validate single field
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required.';
        if (value.trim().length > 50) return 'First name must not exceed 50 characters';
        return undefined;

      case 'lastName':
        if (!value.trim()) return 'Last name is required.';
        if (value.trim().length > 50) return 'Last name must not exceed 50 characters';
        return undefined;

      case 'username':
        if (!value.trim()) return 'Username is required.';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        if (value.trim().length > 30) return 'Username must not exceed 30 characters';
        if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
          return 'Username can only contain letters, numbers, hyphens (-), and underscores (_).';
        }
        return undefined;

      case 'email':
        if (!value.trim()) return 'Work email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return undefined;

      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least 1 uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least 1 lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least 1 number';
        if (!/[^A-Za-z0-9]/.test(value)) {
          return 'Password must contain at least 1 special character';
        }
        return undefined;

      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.password) return 'Passwords do not match.';
        return undefined;

      case 'departmentId':
        if (!value) return 'Please select a department';
        return undefined;

      case 'designation':
        if (!value.trim()) return 'Designation / job title is required.';
        if (value.trim().length > 100) return 'Designation must not exceed 100 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }

    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  // Register admin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof RegisterAdminFormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        departmentId: Number(formData.departmentId),
        designation: formData.designation.trim(),
      };

      const response = await fetch('/api/auth/register/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({
            general:
              result.message ||
              'A user with this username or email already exists. Please choose another.',
          });
        } else if (response.status === 400) {
          if (Array.isArray(result.message)) {
            setErrors({ general: result.message.join('. ') });
          } else {
            setErrors({ general: result.message || 'Invalid registration details provided.' });
          }
        } else {
          setErrors({
            general:
              result.message || 'An error occurred during registration. Please try again later.',
          });
        }
        return;
      }

      if (result.success && result.data) {
        const selectedDept = departments.find((d) => d.id === Number(formData.departmentId));
        setRegisteredUser({
          id: result.data.id || 'N/A',
          username: result.data.username || payload.username,
          email: result.data.email || payload.email,
          firstName: result.data.firstName || payload.firstName,
          lastName: result.data.lastName || payload.lastName,
          role: result.data.role || 'Admin',
          department: selectedDept ? selectedDept.name : result.data.department || 'Administration',
          designation: result.data.designation || payload.designation,
          status: result.data.status || 'Active',
        });
      }
    } catch (err) {
      console.error('Network error during admin registration:', err);
      setErrors({
        general:
          'Unable to connect to the server. Please check your network connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password validation
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(formData.password);

  const passedRequirementsCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthClass = 'strength-weak';
  if (passedRequirementsCount >= 5) {
    strengthLabel = 'Strong';
    strengthClass = 'strength-strong';
  } else if (passedRequirementsCount >= 3) {
    strengthLabel = 'Good';
    strengthClass = 'strength-good';
  } else if (passedRequirementsCount >= 2) {
    strengthLabel = 'Fair';
    strengthClass = 'strength-fair';
  }

  const handleReset = () => {
    setRegisteredUser(null);
    setFormData({
      ...initialFormState,
      departmentId: departments.length > 0 ? String(departments[0].id) : '',
    });
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
        <aside className="auth-sidebar" aria-label="Admin Portal Overview">
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

              <span className="auth-portal-tag">Administrator Account</span>

              <h2 className="auth-sidebar-title">Manage. Grow. Succeed.</h2>
              <p className="auth-sidebar-desc">
                Your complete marketplace management and governance system.
              </p>
              <ul className="auth-sidebar-features">
                <li>
                  <span className="bullet">✓</span> Department &amp; user management
                </li>
                <li>
                  <span className="bullet">✓</span> Secure access governance
                </li>
                <li>
                  <span className="bullet">✓</span> Real-time workspace administration
                </li>
              </ul>
            </div>
            <div className="auth-sidebar-footer">
              <p>© {new Date().getFullYear()} To Be Take • Operations Platform</p>
            </div>
          </div>
        </aside>

        {/* Registration form */}
        <main className="auth-content">
          {registeredUser ? (
            /* Success Screen */
            <div className="success-card">
              <div className="success-icon" aria-hidden="true">
                ✓
              </div>
              <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                Admin Account Created Successfully
              </h2>
              <p className="card-description" style={{ marginBottom: '1.5rem' }}>
                Your administrator account is now active and ready. Here are your account details:
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
                  <span className="success-detail-value">Administrator</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Department:</span>
                  <span className="success-detail-value">{registeredUser.department}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Designation:</span>
                  <span className="success-detail-value">{registeredUser.designation}</span>
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
                <button type="button" onClick={handleReset} className="btn-admin">
                  Register Another Admin
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
                <h1 className="auth-title">Create Admin Account</h1>
                <p className="auth-subtitle">
                  Set up your administrator account to manage your To Be Take workspace.
                </p>
              </header>

              {errors.general && (
                <div className="alert alert-error" role="alert" aria-live="polite">
                  <span aria-hidden="true">⚠</span>
                  <div>{errors.general}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Department error */}
                {departmentError && (
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div>{departmentError}</div>
                    <button
                      type="button"
                      onClick={loadDepartments}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      Retry
                    </button>
                  </div>
                )}

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
                        placeholder="e.g. Alex"
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
                        placeholder="e.g. Mercer"
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
                        placeholder="e.g. alex_mercer"
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

                    {/* Work Email */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">
                        Work Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input ${errors.email ? 'has-error' : ''}`}
                        placeholder="e.g. alex.mercer@tobetake.dev"
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

                {/* Administrative information */}
                <div className="form-section">
                  <h2 className="form-section-title">Administrative Information</h2>
                  <div className="form-row">
                    {/* Department */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="departmentId">
                        Department <span className="required">*</span>
                      </label>
                      <select
                        id="departmentId"
                        name="departmentId"
                        className={`form-select ${errors.departmentId ? 'has-error' : ''}`}
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        disabled={isSubmitting || isLoadingDepartments}
                        aria-invalid={Boolean(errors.departmentId)}
                        aria-describedby={errors.departmentId ? 'departmentId-error' : undefined}
                        required
                      >
                        {isLoadingDepartments ? (
                          <option value="">Loading platform departments...</option>
                        ) : departments.length === 0 ? (
                          <option value="">No departments available</option>
                        ) : (
                          departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name} ({department.code})
                            </option>
                          ))
                        )}
                      </select>
                      {errors.departmentId && (
                        <div id="departmentId-error" className="form-error-text" role="alert">
                          {errors.departmentId}
                        </div>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="designation">
                        Designation / Job Title <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="designation"
                        name="designation"
                        className={`form-input ${errors.designation ? 'has-error' : ''}`}
                        placeholder="e.g. Operations Manager"
                        value={formData.designation}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.designation)}
                        aria-describedby={errors.designation ? 'designation-error' : undefined}
                        required
                      />
                      {errors.designation && (
                        <div id="designation-error" className="form-error-text" role="alert">
                          {errors.designation}
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
                    className="btn-admin"
                    disabled={isSubmitting || isLoadingDepartments}
                    style={{ flex: 1 }}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="badge-dot"
                          style={{ background: '#ffffff', boxShadow: 'none' }}
                        ></span>
                        Creating Admin Account...
                      </>
                    ) : (
                      'Create Admin Account'
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
