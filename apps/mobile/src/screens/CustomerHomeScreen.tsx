import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const CustomerHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your customer account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDirectLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const firstName = user?.firstName || 'Customer';
  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Valued Customer';

  return (
    <View style={styles.safeArea}>
      {/* Authenticated Customer Header with Safe Insets */}
      <Header
        showBrand
        rightElement={
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
            activeOpacity={0.7}
            testID="btn-header-logout"
          >
            <Text style={styles.headerLogoutText}>Sign Out</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Greeting Banner */}
        <View style={styles.greetingSection}>
          <View style={styles.customerBadge}>
            <Text style={styles.customerBadgeText}>Verified Customer</Text>
          </View>
          <Text style={styles.greetingTitle}>Welcome back, {firstName}!</Text>
          <Text style={styles.greetingSubtitle}>
            You are securely signed in to your To Be Take customer account.
          </Text>
        </View>

        {/* Customer Account Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{user?.role || 'Customer'}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Full Name</Text>
              <Text style={styles.profileValue}>{fullName}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Username</Text>
              <Text style={styles.profileValue}>@{user?.username}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{user?.email}</Text>
            </View>

            <View style={[styles.profileRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.profileLabel}>Role Code</Text>
              <Text style={styles.profileValue}>{user?.roleCode || 'CUST'}</Text>
            </View>
          </View>

          <View style={styles.logoutButtonWrapper}>
            <Button
              title="Sign Out"
              onPress={handleDirectLogout}
              loading={isLoggingOut}
              loadingText="Signing out..."
              variant="outline"
              accessibilityLabel="Sign out of your customer account"
              testID="btn-logout"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} To Be Take • Customer Mobile Application
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.linen[200],
  },
  header: {
    backgroundColor: colors.forest[800],
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[700],
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold[500],
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  headerLogoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.forest[700],
    borderWidth: 1,
    borderColor: colors.forest[600],
    minHeight: 36,
    justifyContent: 'center',
  },
  headerLogoutText: {
    color: colors.gold[400],
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  greetingSection: {
    marginBottom: 16,
  },
  customerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.forest[100],
    borderWidth: 1,
    borderColor: colors.forest[400],
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  customerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forest[800],
    letterSpacing: 0.3,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.linen[300],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  roleTag: {
    backgroundColor: colors.forest[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forest[800],
  },
  profileDetails: {
    backgroundColor: colors.linen[100],
    borderWidth: 1,
    borderColor: colors.linen[400],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.linen[400],
  },
  profileLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  logoutButtonWrapper: {
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.linen[400],
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
