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
import { OrderDetailItem } from '@tobetake/shared-types';
import { getCustomerOrders } from '../services/api';
import { AppIcon } from '../components/AppIcon';

interface OrdersListScreenProps {
  onNavigateBack: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const OrdersListScreen: React.FC<OrdersListScreenProps> = ({
  onNavigateBack,
  onSelectOrder,
}) => {
  const [orders, setOrders] = useState<OrderDetailItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerOrders(statusFilter !== 'ALL' ? statusFilter : undefined);
      setOrders(res.items || []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const tabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Retrieving your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onNavigateBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={20} color="#14291f" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Orders</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, statusFilter === t.key && styles.activeTab]}
            onPress={() => setStatusFilter(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: statusFilter === t.key }}
          >
            <Text style={[styles.tabText, statusFilter === t.key && styles.activeTabText]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orders.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconBg}>
            <AppIcon name="orders" size={36} color={colors.forest[800]} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySub}>
            You haven't placed any orders matching this status filter yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => onSelectOrder(item.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Order ${item.orderNumber}`}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.itemsCount}>
                  {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                </Text>
                <Text style={styles.orderPrice}>
                  Rs. {item.totalAmount.toLocaleString('en-PK')}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.trackRow}>
                  <AppIcon name="tracking" size={14} color={colors.forest[800]} />
                  <Text style={styles.trackText}>View Live Tracking</Text>
                </View>
                <AppIcon name="chevron-right" size={16} color="#718077" />
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.forest[800],
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718077',
  },
  activeTabText: {
    color: colors.forest[800],
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
  },
  orderDate: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#edf6ee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forest[800],
    textTransform: 'uppercase',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1ebd8',
    marginBottom: 10,
  },
  itemsCount: {
    fontSize: 13,
    color: '#718077',
  },
  orderPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.forest[900],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest[800],
  },
});
