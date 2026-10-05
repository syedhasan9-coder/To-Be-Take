import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { PasswordStrengthMeter, getPasswordCriteria } from '../components/PasswordStrengthMeter';
import { useAuth } from '../context/AuthContext';
import { CustomerUser, FormErrors } from '../types';

interface RegisterScreenProps {
  onNavigateToSignIn: () => void;
  onNavigateToWelcome: () => void;
  onRegisterSuccess?: (user: CustomerUser) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToSignIn,
  onNavigateToWelcome,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successUser, setSuccessUser] = useState<CustomerUser | null>(null);

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

    const criteria = getPasswordCriteria(formData.password);
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

  const handleRegister = async () => {
    setGeneralError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (!result.success) {
        setGeneralError(result.error || 'Registration failed. Please try again.');
      } else if (result.user) {
        setSuccessUser(result.user);
        if (onRegisterSuccess) {
          onRegisterSuccess(result.user);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setGeneralError(
        'Unable to connect to the server. Please check your network connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header onBack={onNavigateToWelcome} backLabel="← Back to Welcome" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {successUser ? (
            /* Success View */
            <View style={styles.successCard}>
              <View style={styles.successIconBubble}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Customer Account Created</Text>
              <Text style={styles.successSubtitle}>
                Your account is ready! You can now sign in to start shopping.
              </Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>
                    {successUser.firstName} {successUser.lastName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>{successUser.username}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{successUser.email}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Role</Text>
                  <Text style={styles.detailValue}>{successUser.role || 'Customer'}</Text>
                </View>
              </View>

              <Button
                title="Proceed to Sign In"
                onPress={onNavigateToSignIn}
                variant="primary"
                accessibilityLabel="Proceed to customer sign in"
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            /* Registration Form */
            <View>
              {/* Header Intro */}
              <View style={styles.headerSection}>
                <View style={styles.portalTag}>
                  <Text style={styles.portalTagText}>Customer Account</Text>
                </View>
                <Text style={styles.title}>Create Customer Account</Text>
                <Text style={styles.subtitle}>
                  Set up your account to browse stores, order products, and track deliveries.
                </Text>
              </View>

              <AlertBanner message={generalError} type="error" />

              {/* Form Card */}
              <View style={styles.formCard}>
                {/* 1. Personal Information */}
                <Text style={styles.sectionHeading}>1. Personal Information</Text>

                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, firstName: val }));
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  placeholder="e.g. Bilal"
                  error={errors.firstName}
                  required
                  autoCapitalize="words"
                  editable={!isSubmitting}
                  testID="input-first-name"
                />

                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, lastName: val }));
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  placeholder="e.g. Ahmed"
                  error={errors.lastName}
                  required
                  autoCapitalize="words"
                  editable={!isSubmitting}
                  testID="input-last-name"
                />

                {/* 2. Account Information */}
                <Text style={[styles.sectionHeading, { marginTop: 10 }]}>
                  2. Account Information
                </Text>

                <Input
                  label="Username"
                  value={formData.username}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, username: val }));
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  placeholder="e.g. bilalahmed"
                  error={errors.username}
                  required
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  testID="input-username"
                />

                <Input
                  label="Email Address"
                  value={formData.email}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, email: val }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="e.g. bilal.ahmed@example.pk"
                  error={errors.email}
                  required
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  testID="input-email"
                />

                <Input
                  label="Password"
                  value={formData.password}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, password: val }));
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="At least 8 characters"
                  error={errors.password}
                  required
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  testID="input-password"
                />

                <PasswordStrengthMeter password={formData.password} />

                <Input
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(val) => {
                    setFormData((prev) => ({ ...prev, confirmPassword: val }));
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Re-enter password"
                  error={errors.confirmPassword}
                  required
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  testID="input-confirm-password"
                />

                <View style={styles.actionContainer}>
                  <Button
                    title="Create Customer Account"
                    onPress={handleRegister}
                    loading={isSubmitting}
                    loadingText="Creating Account..."
                    variant="primary"
                    accessibilityLabel="Submit customer account registration"
                    testID="btn-submit-register"
                  />
                </View>

                {/* Bottom Link to Sign In */}
                <View style={styles.signInLinkRow}>
                  <Text style={styles.signInPromptText}>Already have an account?</Text>
                  <TouchableOpacity
                    onPress={onNavigateToSignIn}
                    accessibilityRole="button"
                    accessibilityLabel="Navigate to customer sign in"
                    activeOpacity={0.7}
                    style={styles.signInLinkBtn}
                  >
                    <Text style={styles.signInLinkText}>Sign In →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.linen[200],
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 20,
  },
  portalTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.linen[300],
    borderColor: colors.linen[400],
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  portalTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.linen[300],
  },
  actionContainer: {
    marginTop: 14,
  },
  signInLinkRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.linen[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInPromptText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signInLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest[800],
  },
  successCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  successIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.successBg,
    borderWidth: 1.5,
    borderColor: colors.status.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheckmark: {
    fontSize: 32,
    color: colors.forest[800],
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.linen[100],
    borderWidth: 1,
    borderColor: colors.linen[400],
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.linen[400],
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
