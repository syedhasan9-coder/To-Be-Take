import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { CustomerTabType } from '../types';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon, IconName } from './AppIcon';

interface CustomerTabBarProps {
  activeTab: CustomerTabType;
  onSelectTab: (tab: CustomerTabType) => void;
}

interface TabItem {
  key: CustomerTabType;
  label: string;
  iconActive: IconName;
  iconInactive: IconName;
  badgeCount?: number;
}

export const CustomerTabBar: React.FC<CustomerTabBarProps> = ({ activeTab, onSelectTab }) => {
  const { cartCount, wishlistCount, unreadNotificationsCount } = useCustomerCart();

  const tabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      key: 'catalog',
      label: 'Explore',
      iconActive: 'catalog',
      iconInactive: 'explore',
    },
    {
      key: 'cart',
      label: 'Cart',
      iconActive: 'cart',
      iconInactive: 'cart-outline',
      badgeCount: cartCount,
    },
    {
      key: 'wishlist',
      label: 'Wishlist',
      iconActive: 'wishlist-fill',
      iconInactive: 'wishlist',
      badgeCount: wishlistCount,
    },
    {
      key: 'account',
      label: 'Account',
      iconActive: 'account',
      iconInactive: 'account-outline',
      badgeCount: unreadNotificationsCount > 0 ? -1 : 0,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            testID={`tab-${tab.key}`}
          >
            <View style={styles.iconWrapper}>
              <AppIcon
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={23}
                color={isActive ? colors.forest[800] : '#718077'}
              />
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                  </Text>
                </View>
              )}
              {tab.badgeCount === -1 && <View style={styles.dotBadge} />}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8e2d4',
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#718077',
    marginTop: 3,
  },
  activeTabLabel: {
    color: colors.forest[800],
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.forest[800],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.gold[600],
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  dotBadge: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold[600],
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
