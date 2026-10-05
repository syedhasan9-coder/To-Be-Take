import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerNotificationItem } from '@tobetake/shared-types';
import { getCustomerNotifications, markCustomerNotificationRead } from '../services/api';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon, IconName } from '../components/AppIcon';

interface NotificationsScreenProps {
  onNavigateBack: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateBack,
  onNavigateToOrder,
}) => {
  const { refreshNotifications } = useCustomerCart();
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleItemPress = async (item: CustomerNotificationItem) => {
    if (!item.isRead) {
      await markCustomerNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      await refreshNotifications();
    }
    if (item.targetUrl && item.targetUrl.includes('/orders/') && onNavigateToOrder) {
      const orderId = item.targetUrl.split('/orders/')[1]?.split('?')[0];
      if (orderId) onNavigateToOrder(orderId);
    }
  };

  const getNotifIcon = (type: string = ''): IconName => {
    const t = type.toLowerCase();
    if (t.includes('order') || t.includes('shipped') || t.includes('deliver')) return 'delivery';
    if (t.includes('pay') || t.includes('refund')) return 'card';
    if (t.includes('review') || t.includes('star')) return 'star';
    return 'notifications';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onNavigateBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={20} color="#14291f" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconBg}>
            <AppIcon name="notifications" size={36} color={colors.forest[800]} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySub}>
            You will receive live order status and delivery updates here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.unreadCard]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.iconBg}>
                <AppIcon
                  name={getNotifIcon(item.type)}
                  size={18}
                  color={colors.forest[800]}
                />
              </View>

              <View style={styles.notifBody}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.unreadText]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notifMessage}>{item.message}</Text>

                <Text style={styles.notifTime}>
                  {new Date(item.createdAt).toLocaleDateString('en-PK', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f5ee',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.forest[800],
    fontWeight: '600',
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#edf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cde0d0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#718077',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3ece0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    gap: 12,
  },
  unreadCard: {
    borderColor: colors.forest[600],
    backgroundColor: '#f5faf6',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#edf6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
    flex: 1,
  },
  unreadText: {
    color: colors.forest[900],
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest[800],
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: '#344e41',
    lineHeight: 17,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: '#718077',
  },
});
