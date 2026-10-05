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
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onNavigateToOrders,
  onNavigateToAddresses,
  onNavigateToNotifications,
  onNavigateToReviews,
  onNavigateToWishlist,
}) => {
  const { user, logout } = useAuth();
  const { unreadNotificationsCount } = useCustomerCart();
  const [profile, setProfile] = useState<CustomerProfileSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getCustomerProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
