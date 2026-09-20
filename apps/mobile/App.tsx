import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegisteredBuyer {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role?: string;
}

type ScreenMode = 'home' | 'buyer-register';

declare const process: { env?: { [key: string]: string | undefined } } | undefined;
const API_BASE_URL =
  (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:4000/api';

export default function App(): React.ReactElement {
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('home');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successUser, setSuccessUser] = useState<RegisteredBuyer | null>(null);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setGeneralError(null);
    setSuccessUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const navigateTo = (screen: ScreenMode) => {
    resetForm();
    setCurrentScreen(screen);
  };

  // Password strength
  const getPasswordCriteria = (pwd: string) => ({
    hasMinLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[@$!%*?&^#()_\-+=<>.,:;]/.test(pwd),
  });

  const getPasswordStrength = (pwd: string): { label: string; level: number; color: string } => {
    if (!pwd) return { label: 'None', level: 0, color: '#e8e4db' };
    const c = getPasswordCriteria(pwd);
    const score = [c.hasMinLength, c.hasUpper, c.hasLower, c.hasNumber, c.hasSpecial].filter(
      Boolean,
    ).length;

    if (score <= 2) return { label: 'Weak', level: 1, color: '#ef4444' };
    if (score === 3) return { label: 'Fair', level: 2, color: '#d97706' };
    if (score === 4) return { label: 'Good', level: 3, color: '#2563eb' };
    return { label: 'Strong', level: 4, color: '#16a34a' };
  };

  const criteria = getPasswordCriteria(formData.password);
  const strength = getPasswordStrength(formData.password);

  // Validate form
  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const cleanFirstName = formData.firstName.trim();
    if (!cleanFirstName) {
      nextErrors.firstName = 'First name is required';
    } else if (cleanFirstName.length < 2) {
      nextErrors.firstName = 'First name must be at least 2 characters';
    } else if (cleanFirstName.length > 50) {
      nextErrors.firstName = 'First name must not exceed 50 characters';
    }

    const cleanLastName = formData.lastName.trim();
    if (!cleanLastName) {
      nextErrors.lastName = 'Last name is required';
    } else if (cleanLastName.length < 2) {
      nextErrors.lastName = 'Last name must be at least 2 characters';
    } else if (cleanLastName.length > 50) {
      nextErrors.lastName = 'Last name must not exceed 50 characters';
    }

    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      nextErrors.username = 'Username is required';
    } else if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      nextErrors.username = 'Username must be between 3 and 30 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      nextErrors.username = 'Username may only contain letters, numbers, hyphens, and underscores';
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (
      !criteria.hasMinLength ||
      !criteria.hasUpper ||
      !criteria.hasLower ||
      !criteria.hasNumber ||
      !criteria.hasSpecial
    ) {
      nextErrors.password = 'Password must meet all complexity requirements';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Register buyer
  const handleSubmit = async () => {
    setGeneralError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setGeneralError('This username or email is already registered.');
        } else if (data.message) {
          setGeneralError(
            Array.isArray(data.message) ? data.message.join(', ') : String(data.message),
          );
        } else {
          setGeneralError('Registration failed. Please check your information and try again.');
        }
        return;
      }

      setSuccessUser({
        id: data.data?.id || data.id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        username: payload.username,
        email: payload.email,
        role: data.data?.role || 'Buyer',
      });
    } catch {
      setGeneralError(
        'Unable to connect to the server. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {currentScreen !== 'home' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigateTo('home')}
              accessibilityLabel="Back to Home"
            >
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.brandContainer}>
              <View style={styles.brandDot} />
              <Text style={styles.brandTitle}>To Be Take</Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Home screen */}
          {currentScreen === 'home' && (
            <View style={styles.homeContainer}>
              <View style={styles.heroSection}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Your marketplace platform</Text>
                </View>
                <Text style={styles.heroTitle}>To Be Take</Text>
                <Text style={styles.heroSubtitle}>
                  Welcome to To Be Take. Discover verified products and enjoy a smooth shopping
                  experience.
                </Text>
              </View>

              {/* Action cards */}
              <View style={styles.cardsContainer}>
                {/* Buyer registration */}
                <View style={styles.actionCard}>
                  <Text style={styles.cardEyebrowAccent}>For Customers &amp; Buyers</Text>
                  <Text style={styles.cardTitle}>Buyer Registration</Text>
                  <Text style={styles.cardDescription}>
                    Create your customer account to start browsing and shopping.
                  </Text>

                  <View style={styles.featureList}>
                    <Text style={styles.featureItem}>
                      ✓ Discover verified stores &amp; products
                    </Text>
                    <Text style={styles.featureItem}>✓ Fast, safe &amp; secure checkout</Text>
                    <Text style={styles.featureItem}>✓ Real-time order tracking &amp; history</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigateTo('buyer-register')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnPrimaryText}>Register as Buyer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © {new Date().getFullYear()} To Be Take. All rights reserved.
                </Text>
              </View>
            </View>
          )}

          {/* Buyer registration screen */}
          {currentScreen === 'buyer-register' && (
            <View style={styles.formContainer}>
              {successUser ? (
                /* Success view */
                <View style={styles.successCard}>
                  <View style={styles.successIconContainer}>
                    <Text style={styles.successCheckmark}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Buyer Account Created Successfully</Text>
                  <Text style={styles.successSubtitle}>
                    Your account has been set up and is ready for use.
                  </Text>

                  <View style={styles.successDetailsCard}>
                    <View style={styles.successDetailRow}>
                      <Text style={styles.successLabel}>Full Name</Text>
                      <Text style={styles.successValue}>
                        {successUser.firstName} {successUser.lastName}
                      </Text>
                    </View>
                    <View style={styles.successDetailRow}>
                      <Text style={styles.successLabel}>Username</Text>
                      <Text style={styles.successValue}>{successUser.username}</Text>
                    </View>
                    <View style={styles.successDetailRow}>
                      <Text style={styles.successLabel}>Email</Text>
                      <Text style={styles.successValue}>{successUser.email}</Text>
                    </View>
                    <View style={[styles.successDetailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.successLabel}>Account Role</Text>
                      <Text style={styles.successValue}>{successUser.role || 'Buyer'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigateTo('home')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnPrimaryText}>Return to Home</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Registration form */
                <View>
                  <View style={styles.formHeader}>
                    <Text style={styles.pageTitle}>Create Buyer Account</Text>
                    <Text style={styles.pageSubtitle}>
                      Set up your customer account to start shopping on To Be Take.
                    </Text>
                  </View>

                  {/* General error */}
                  {generalError && (
                    <View style={styles.alertError}>
                      <Text style={styles.alertErrorText}>{generalError}</Text>
                    </View>
                  )}

                  {/* Personal information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Personal Information</Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        First Name <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, errors.firstName ? styles.inputError : undefined]}
                        placeholder="e.g. Alex"
                        placeholderTextColor="#8c9990"
                        value={formData.firstName}
                        onChangeText={(val) => {
                          setFormData((p) => ({ ...p, firstName: val }));
                          if (errors.firstName) setErrors((p) => ({ ...p, firstName: undefined }));
                        }}
                        autoCapitalize="words"
                        editable={!isSubmitting}
                      />
                      {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Last Name <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, errors.lastName ? styles.inputError : undefined]}
                        placeholder="e.g. Mercer"
                        placeholderTextColor="#8c9990"
                        value={formData.lastName}
                        onChangeText={(val) => {
                          setFormData((p) => ({ ...p, lastName: val }));
                          if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }));
                        }}
                        autoCapitalize="words"
                        editable={!isSubmitting}
                      />
                      {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                    </View>
                  </View>

                  {/* 2. Account Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Account Information</Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Username <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, errors.username ? styles.inputError : undefined]}
                        placeholder="e.g. alexmercer"
                        placeholderTextColor="#8c9990"
                        value={formData.username}
                        onChangeText={(val) => {
                          setFormData((p) => ({ ...p, username: val }));
                          if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                      />
                      {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Email Address <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, errors.email ? styles.inputError : undefined]}
                        placeholder="e.g. alex.mercer@example.com"
                        placeholderTextColor="#8c9990"
                        value={formData.email}
                        onChangeText={(val) => {
                          setFormData((p) => ({ ...p, email: val }));
                          if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        editable={!isSubmitting}
                      />
                      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Password <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.passwordInput,
                            errors.password ? styles.inputError : undefined,
                          ]}
                          placeholder="At least 8 characters"
                          placeholderTextColor="#8c9990"
                          value={formData.password}
                          onChangeText={(val) => {
                            setFormData((p) => ({ ...p, password: val }));
                            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                          }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSubmitting}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => setShowPassword((prev) => !prev)}
                          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <Text style={styles.passwordToggleText}>
                            {showPassword ? 'Hide' : 'Show'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                      {/* Password Strength Meter */}
                      {formData.password.length > 0 && (
                        <View style={styles.passwordMeter}>
                          <View style={styles.passwordMeterBarBg}>
                            <View
                              style={[
                                styles.passwordMeterBarProgress,
                                {
                                  width: `${(strength.level / 4) * 100}%`,
                                  backgroundColor: strength.color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.strengthLabel, { color: strength.color }]}>
                            Strength: {strength.label}
                          </Text>

                          <View style={styles.checklist}>
                            <Text
                              style={[
                                styles.checkItem,
                                criteria.hasMinLength ? styles.checkItemMet : undefined,
                              ]}
                            >
                              {criteria.hasMinLength ? '✓' : '○'} 8+ characters
                            </Text>
                            <Text
                              style={[
                                styles.checkItem,
                                criteria.hasUpper ? styles.checkItemMet : undefined,
                              ]}
                            >
                              {criteria.hasUpper ? '✓' : '○'} Uppercase letter
                            </Text>
                            <Text
                              style={[
                                styles.checkItem,
                                criteria.hasLower ? styles.checkItemMet : undefined,
                              ]}
                            >
                              {criteria.hasLower ? '✓' : '○'} Lowercase letter
                            </Text>
                            <Text
                              style={[
                                styles.checkItem,
                                criteria.hasNumber ? styles.checkItemMet : undefined,
                              ]}
                            >
                              {criteria.hasNumber ? '✓' : '○'} Number
                            </Text>
                            <Text
                              style={[
                                styles.checkItem,
                                criteria.hasSpecial ? styles.checkItemMet : undefined,
                              ]}
                            >
                              {criteria.hasSpecial ? '✓' : '○'} Special character
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Confirm Password <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.passwordInput,
                            errors.confirmPassword ? styles.inputError : undefined,
                          ]}
                          placeholder="Re-enter password"
                          placeholderTextColor="#8c9990"
                          value={formData.confirmPassword}
                          onChangeText={(val) => {
                            setFormData((p) => ({ ...p, confirmPassword: val }));
                            if (errors.confirmPassword)
                              setErrors((p) => ({ ...p, confirmPassword: undefined }));
                          }}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSubmitting}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => setShowConfirmPassword((prev) => !prev)}
                          accessibilityLabel={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
                        >
                          <Text style={styles.passwordToggleText}>
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.btnPrimary, isSubmitting ? styles.btnDisabled : undefined]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <View style={styles.submittingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[styles.btnPrimaryText, { marginLeft: 8 }]}>
                          Creating Buyer Account...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.btnPrimaryText}>Create Buyer Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f2eb',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#14291f',
    borderBottomWidth: 1,
    borderBottomColor: '#1b3b2b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4a34b',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d4a34b',
  },
  homeContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee9dc',
    borderColor: '#e6dfd3',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14291f',
    marginRight: 6,
  },
  badgeText: {
    color: '#5c6b62',
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#19201c',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#5c6b62',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#19201c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardEyebrowAccent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a07425',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#19201c',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#5c6b62',
    lineHeight: 20,
    marginBottom: 14,
  },
  featureList: {
    marginBottom: 16,
    gap: 6,
  },
  featureItem: {
    fontSize: 13,
    color: '#46534b',
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: '#14291f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6dfd3',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#8c9990',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#19201c',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#5c6b62',
    lineHeight: 20,
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertErrorText: {
    color: '#991b1b',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c6b62',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f2eb',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#19201c',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#19201c',
  },
  inputError: {
    borderColor: '#f87171',
    backgroundColor: '#fffafb',
  },
  passwordInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14291f',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  passwordMeter: {
    backgroundColor: '#eee9dc',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  passwordMeterBarBg: {
    height: 4,
    backgroundColor: '#e2dbce',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  passwordMeterBarProgress: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  checklist: {
    gap: 3,
  },
  checkItem: {
    fontSize: 11,
    color: '#8c9990',
  },
  checkItemMet: {
    color: '#16a34a',
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eaf5ed',
    borderWidth: 1,
    borderColor: '#bce0cb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheckmark: {
    fontSize: 28,
    color: '#14291f',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#19201c',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#5c6b62',
    textAlign: 'center',
    marginBottom: 20,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: '#faf7f0',
    borderWidth: 1,
    borderColor: '#e6dfd3',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6dfd3',
  },
  successLabel: {
    fontSize: 13,
    color: '#5c6b62',
  },
  successValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#19201c',
  },
});
