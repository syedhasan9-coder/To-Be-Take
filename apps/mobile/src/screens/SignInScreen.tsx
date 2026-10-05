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
import { useAuth } from '../context/AuthContext';

interface SignInScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToWelcome: () => void;
  onLoginSuccess?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateToRegister,
  onNavigateToWelcome,
  onLoginSuccess,
}) => {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const nextErrors: { identifier?: string; password?: string } = {};

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      nextErrors.identifier = 'Username or email is required';
    } else if (cleanIdentifier.length < 3) {
      nextErrors.identifier = 'Username or email must be at least 3 characters';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignIn = async () => {
    setErrors({});
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrors({
          general: result.error || 'Invalid login credentials. Please try again.',
        });
      } else if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setErrors({
        general:
          'Unable to connect to the server. Please check your network connection and try again.',
      });
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
          {/* Header Title & Intro */}
          <View style={styles.headerSection}>
            <View style={styles.portalTag}>
              <Text style={styles.portalTagText}>Customer Account</Text>
            </View>
            <Text style={styles.title}>Customer Sign In</Text>
            <Text style={styles.subtitle}>
              Enter your username or email and password to access your shopping account.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <AlertBanner message={errors.general ?? null} type="error" />

            <Input
              label="Username or Email"
              value={identifier}
              onChangeText={(val) => {
                setIdentifier(val);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              placeholder="e.g. bilalahmed or bilal@example.pk"
              error={errors.identifier}
              required
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              accessibilityLabel="Username or email address"
              accessibilityHint="Enter your registered username or email"
              testID="input-identifier"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              error={errors.password}
              required
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              accessibilityLabel="Password"
              accessibilityHint="Enter your account password"
              testID="input-password"
            />

            <View style={styles.actionContainer}>
              <Button
                title="Sign In as Customer"
                onPress={handleSignIn}
                loading={isSubmitting}
                loadingText="Signing in..."
                variant="primary"
                accessibilityLabel="Sign in to your account"
                testID="btn-submit-login"
              />
            </View>

            {/* Bottom Link to Register */}
            <View style={styles.registerLinkRow}>
              <Text style={styles.registerPromptText}>{"Don't have an account?"}</Text>
              <TouchableOpacity
                onPress={onNavigateToRegister}
                accessibilityRole="button"
                accessibilityLabel="Navigate to customer registration"
                activeOpacity={0.7}
                style={styles.registerLinkBtn}
              >
                <Text style={styles.registerLinkText}>Create Account →</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  actionContainer: {
    marginTop: 10,
  },
  registerLinkRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.linen[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  registerPromptText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  registerLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest[800],
  },
});
