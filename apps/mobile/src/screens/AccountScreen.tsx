import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerProfileSummary } from '@tobetake/shared-types';
import { getCustomerProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon } from '../components/AppIcon';

interface AccountScreenProps {
  onNavigateToOrders: () => void;
  onNavigateToAddresses: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToReviews: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToSignIn?: () => void;
  onNavigateToRegister?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onNavigateToOrders,
  onNavigateToAddresses,
  onNavigateToNotifications,
  onNavigateToReviews,
  onNavigateToWishlist,
  onNavigateToSignIn,
  onNavigateToRegister,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadNotificationsCount } = useCustomerCart();
  const [profile, setProfile] = useState<CustomerProfileSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCustomerProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile summary:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your customer account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch (err) {
            console.error('Sign out error:', err);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleProtectedAction = (action: () => void) => {
    if (!isAuthenticated) {
      if (onNavigateToSignIn) {
        onNavigateToSignIn();
      } else {
        Alert.alert('Sign In Required', 'Please sign in to access this feature.');
      }
      return;
    }
    action();
  };

  // ---------------- GUEST VIEW ---------------- //
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Customer Account</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Guest Welcome Card */}
          <View style={styles.guestCard}>
            <View style={styles.guestIconBg}>
              <AppIcon name="shield" size={28} color={colors.forest[800]} />
            </View>
            <Text style={styles.guestTitle}>Welcome to To Be Take</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to manage your orders, track TCS deliveries in real time, and access your saved addresses.
            </Text>

            <TouchableOpacity
              style={styles.primaryAuthBtn}
              onPress={onNavigateToSignIn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign in as customer"
            >
              <Text style={styles.primaryAuthBtnText}>Sign In as Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAuthBtn}
              onPress={onNavigateToRegister}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Create customer account"
            >
              <Text style={styles.secondaryAuthBtnText}>Create New Account →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProtectedAction(onNavigateToOrders)}
              accessibilityRole="button"
              accessibilityLabel="My Orders"
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <AppIcon name="orders" size={18} color={colors.forest[800]} />
                </View>
                <Text style={styles.menuLabel}>My Orders & Live Tracking</Text>
              </View>
              <AppIcon name="chevron-right" size={18} color="#9aa79f" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProtectedAction(onNavigateToAddresses)}
              accessibilityRole="button"
              accessibilityLabel="Delivery Addresses"
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <AppIcon name="location" size={18} color={colors.forest[800]} />
                </View>
                <Text style={styles.menuLabel}>Delivery Addresses (Pakistan)</Text>
              </View>
              <AppIcon name="chevron-right" size={18} color="#9aa79f" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={onNavigateToWishlist}
              accessibilityRole="button"
              accessibilityLabel="Saved Wishlist"
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <AppIcon name="wishlist" size={18} color={colors.forest[800]} />
                </View>
                <Text style={styles.menuLabel}>Saved Treasures / Wishlist</Text>
              </View>
              <AppIcon name="chevron-right" size={18} color="#9aa79f" />
            </TouchableOpacity>
          </View>

          {/* Pakistani Courier & Trust strip */}
          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>Pakistan's Trusted Artisanal Network</Text>
            <View style={styles.trustGrid}>
              <View style={styles.trustItem}>
                <AppIcon name="delivery" size={18} color={colors.forest[800]} />
                <Text style={styles.trustItemTitle}>TCS & Leopards</Text>
                <Text style={styles.trustItemSub}>Nationwide courier tracking</Text>
              </View>
              <View style={styles.trustItem}>
                <AppIcon name="cash" size={18} color={colors.forest[800]} />
                <Text style={styles.trustItemTitle}>COD & Raast</Text>
                <Text style={styles.trustItemSub}>JazzCash & EasyPaisa</Text>
              </View>
              <View style={styles.trustItem}>
                <AppIcon name="shield" size={18} color={colors.forest[800]} />
                <Text style={styles.trustItemTitle}>100% Authentic</Text>
                <Text style={styles.trustItemSub}>Artisan verified quality</Text>
              </View>
            </View>
          </View>

          {/* Customer Support */}
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Customer Support Pakistan</Text>
            <Text style={styles.supportDesc}>
              Need assistance with your orders, courier tracking, or returns?
            </Text>
            <View style={styles.supportContacts}>
              <View style={styles.contactItem}>
                <AppIcon name="phone" size={14} color={colors.forest[800]} />
                <Text style={styles.contactText}>+92 300 1234567</Text>
              </View>
              <View style={styles.contactItem}>
                <AppIcon name="mail" size={14} color={colors.forest[800]} />
                <Text style={styles.contactText}>support@tobetake.pk</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------------- AUTHENTICATED VIEW ---------------- //
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : `${user?.firstName || 'Valued'} ${user?.lastName || 'Customer'}`;
  const initials = (user?.firstName?.[0] || 'C') + (user?.lastName?.[0] || 'T');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>My Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.verifiedRow}>
              <Text style={styles.profileName}>{fullName}</Text>
              <View style={styles.verifiedTag}>
                <AppIcon name="check" size={10} color={colors.forest[800]} />
                <Text style={styles.verifiedTagText}>Customer</Text>
              </View>
            </View>
            <Text style={styles.profileUsername}>@{profile?.username || user?.username}</Text>
            <Text style={styles.profileEmail}>{profile?.email || user?.email}</Text>
            {profile?.phone && (
              <View style={styles.phoneRow}>
                <AppIcon name="phone" size={12} color="#718077" />
                <Text style={styles.profilePhone}>{profile.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statItem} onPress={onNavigateToOrders} accessibilityRole="button">
            <Text style={styles.statNum}>{profile?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity style={styles.statItem} onPress={onNavigateToWishlist} accessibilityRole="button">
            <Text style={styles.statNum}>{profile?.totalWishlist || 0}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity style={styles.statItem} onPress={onNavigateToReviews} accessibilityRole="button">
            <Text style={styles.statNum}>{profile?.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToOrders}
            accessibilityRole="button"
            accessibilityLabel="My Orders and live tracking"
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="orders" size={18} color={colors.forest[800]} />
              </View>
              <Text style={styles.menuLabel}>My Orders & Live Tracking</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color="#9aa79f" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToAddresses}
            accessibilityRole="button"
            accessibilityLabel="Delivery Addresses"
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="location" size={18} color={colors.forest[800]} />
              </View>
              <Text style={styles.menuLabel}>Delivery Addresses (Pakistan)</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color="#9aa79f" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="notifications" size={18} color={colors.forest[800]} />
              </View>
              <Text style={styles.menuLabel}>Notifications</Text>
            </View>
            <View style={styles.menuRightBadge}>
              {unreadNotificationsCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadNotificationsCount} new</Text>
                </View>
              )}
              <AppIcon name="chevron-right" size={18} color="#9aa79f" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToReviews}
            accessibilityRole="button"
            accessibilityLabel="My Verified Reviews"
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="star" size={18} color={colors.forest[800]} />
              </View>
              <Text style={styles.menuLabel}>My Verified Reviews</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color="#9aa79f" />
          </TouchableOpacity>
        </View>

        {/* Platform Support Card */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Customer Support Pakistan</Text>
          <Text style={styles.supportDesc}>
            Need assistance with your orders, courier tracking, or returns?
          </Text>
          <View style={styles.supportContacts}>
            <View style={styles.contactItem}>
              <AppIcon name="phone" size={14} color={colors.forest[800]} />
              <Text style={styles.contactText}>+92 300 1234567</Text>
            </View>
            <View style={styles.contactItem}>
              <AppIcon name="mail" size={14} color={colors.forest[800]} />
              <Text style={styles.contactText}>support@tobetake.pk</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <View style={styles.signOutRow}>
              <AppIcon name="logout" size={16} color="#dc2626" />
              <Text style={styles.signOutText}>Sign Out of Customer Account</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  guestIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#edf6ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d6ebd9',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#718077',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 280,
  },
  primaryAuthBtn: {
    width: '100%',
    backgroundColor: colors.forest[800],
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryAuthBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryAuthBtn: {
    width: '100%',
    backgroundColor: '#f6f2e8',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryAuthBtnText: {
    color: colors.forest[900],
    fontSize: 13,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.forest[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gold[400],
  },
  profileInfo: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14291f',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#edf6ee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forest[800],
  },
  profileUsername: {
    fontSize: 12,
    color: colors.forest[700],
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#718077',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 12,
    color: '#718077',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.forest[900],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#718077',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#e8e2d4',
    alignSelf: 'center',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1ebd8',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f6f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14291f',
  },
  menuRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    backgroundColor: colors.gold[600],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  trustCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14291f',
    textAlign: 'center',
    marginBottom: 12,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  trustItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14291f',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  trustItemSub: {
    fontSize: 9,
    color: '#718077',
    textAlign: 'center',
  },
  supportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 4,
  },
  supportDesc: {
    fontSize: 12,
    color: '#718077',
    marginBottom: 10,
    lineHeight: 17,
  },
  supportContacts: {
    flexDirection: 'row',
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: colors.forest[800],
    fontWeight: '600',
  },
  signOutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
});
