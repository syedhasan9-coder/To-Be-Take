import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { OrderDetailItem } from '@tobetake/shared-types';
import {
  getCustomerOrderDetail,
  cancelCustomerOrder,
  requestCustomerReturn,
} from '../services/api';
import { AppIcon, IconName } from '../components/AppIcon';
import { formatRs } from '../utils/formatters';

interface TimelineStep {
  key: string;
  label: string;
  iconName: IconName;
  desc: string;
}

const ORDER_TIMELINE_STEPS: TimelineStep[] = [
  { key: 'PENDING', label: 'Placed', iconName: 'orders', desc: 'Order received & logged' },
  { key: 'CONFIRMED', label: 'Confirmed', iconName: 'check-circle', desc: 'Artisan confirmed item' },
  { key: 'PROCESSING', label: 'Processing', iconName: 'orders', desc: 'Packed & dispatched' },
  { key: 'SHIPPED', label: 'Shipped', iconName: 'delivery', desc: 'In courier transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', iconName: 'tracking', desc: 'Rider on route' },
  { key: 'DELIVERED', label: 'Delivered', iconName: 'home', desc: 'Successfully delivered' },
];

const STATUS_PROGRESSION_MAP: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  CANCELLED: 0,
  REFUNDED: 0,
};

interface OrderTrackingScreenProps {
  orderId: string;
  onNavigateBack: () => void;
  onNavigateToProduct?: (productId: string) => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orderId,
  onNavigateBack,
  onNavigateToProduct,
}) => {
  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [acting, setActing] = useState<boolean>(false);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerOrderDetail(orderId);
      setOrder(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No, Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            try {
              const updated = await cancelCustomerOrder(orderId, 'Cancelled by customer via mobile app');
              setOrder(updated);
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to cancel order.');
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  };

  const handleReturnRequest = () => {
    Alert.alert(
      'Request Return & Refund',
      'Would you like to request a 7-day return on this delivered order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: async () => {
            setActing(true);
            try {
              const updated = await requestCustomerReturn(orderId, 'Customer return request via mobile app');
              setOrder(updated);
              Alert.alert('Return Requested', 'Our support team will review your request within 24 hours.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to request return.');
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Fetching live order status...</Text>
      </View>
    );
  }

  const currentProgression = STATUS_PROGRESSION_MAP[order.status] || 1;
  const isTerminal = order.status === 'CANCELLED';
  const shippingFee = Number(order.shippingTotal || order.shippingAmount || 0);
  const discountTotal = Number(order.discountTotal || order.discountAmount || 0);
  const totalPayable = Number(order.total || order.totalAmount || 0);
  const trackingNumber = order.shipments?.[0]?.trackingNumber;

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
        <Text style={styles.topTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Status Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Order Status</Text>
              <Text style={styles.statusValue}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{order.paymentStatus}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Live Timeline Progression */}
        {!isTerminal && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeading}>Live Delivery Timeline</Text>
            <View style={styles.timelineList}>
              {ORDER_TIMELINE_STEPS.map((step, idx) => {
                const stepProgression = idx + 1;
                const isPassed = currentProgression >= stepProgression;
                const isCurrent = currentProgression === stepProgression;

                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.timelineLeftCol}>
                      <View
                        style={[
                          styles.timelineNode,
                          isPassed && styles.timelineNodePassed,
                          isCurrent && styles.timelineNodeCurrent,
                        ]}
                      >
                        <AppIcon
                          name={step.iconName}
                          size={14}
                          color={isPassed ? '#ffffff' : '#718077'}
                        />
                      </View>
                      {idx < ORDER_TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isPassed && currentProgression > stepProgression && styles.timelineLinePassed,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isPassed && styles.stepTitlePassed,
                          isCurrent && styles.stepTitleCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Courier & Tracking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Courier & Logistics</Text>
          <View style={styles.courierRow}>
            <View style={styles.courierIconBg}>
              <AppIcon name="delivery" size={20} color={colors.forest[800]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>
                {trackingNumber ? `TCS Tracking: ${trackingNumber}` : 'Standard Courier Dispatch (TCS / Trax)'}
              </Text>
              <Text style={styles.courierSub}>Estimated transit time: 2-4 business days</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Destination</Text>
          <View style={styles.addrRow}>
            <AppIcon name="location" size={16} color={colors.forest[800]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addrRecipient}>{order.customerName}</Text>
              <Text style={styles.addrText}>{order.shippingAddress || order.shippingAddress1 || 'Address on file'}</Text>
              <Text style={styles.addrCity}>
                {order.shippingCity || 'Pakistan'}, {order.shippingState || ''} {order.customerPhone ? `• ${order.customerPhone}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchased Treasures ({order.items.length})</Text>
          <View style={styles.itemsList}>
            {order.items.map((item) => {
              const unitPrice = Number(item.unitPrice) || 0;
              const lineTotal = Number(item.totalPrice) || (unitPrice * item.quantity);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => item.productId && onNavigateToProduct?.(item.productId)}
                  activeOpacity={0.8}
                  disabled={!item.productId || !onNavigateToProduct}
                >
                  <View style={styles.itemImgWrapper}>
                    <View style={styles.noImg}>
                      <AppIcon name="leaf" size={20} color={colors.forest[400]} />
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productName || item.productTitle}
                    </Text>
                    <Text style={styles.itemPriceQty}>
                      {item.quantity}x • Rs. {formatRs(unitPrice)}
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    Rs. {formatRs(lineTotal)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Subtotal</Text>
            <Text style={styles.sumVal}>Rs. {formatRs(order.subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Courier Fee</Text>
            <Text style={styles.sumVal}>
              {shippingFee === 0 ? 'FREE' : `Rs. ${formatRs(shippingFee)}`}
            </Text>
          </View>
          {discountTotal > 0 ? (
            <View style={styles.sumRow}>
              <Text style={[styles.sumLabel, { color: '#137333' }]}>Discount</Text>
              <Text style={[styles.sumVal, { color: '#137333' }]}>
                - Rs. {formatRs(discountTotal)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.sumRow, styles.sumTotalRow]}>
            <Text style={styles.sumTotalLabel}>Total Paid / Payable</Text>
            <Text style={styles.sumTotalVal}>Rs. {formatRs(totalPayable)}</Text>
          </View>
        </View>

        {/* Actions (Cancel / Return) */}
        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelOrder}
            disabled={acting}
            accessibilityRole="button"
            accessibilityLabel="Cancel order"
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {order.status === 'DELIVERED' && (
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={handleReturnRequest}
            disabled={acting}
            accessibilityRole="button"
            accessibilityLabel="Request return"
          >
            <Text style={styles.returnBtnText}>Request 7-Day Return / Refund</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.forest[800],
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#14291f',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  statusCard: {
    backgroundColor: colors.forest[800],
    borderRadius: 14,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.gold[400],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    color: '#d6e2db',
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 16,
  },
  timelineList: {
    gap: 0,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e8e2d4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodePassed: {
    backgroundColor: colors.forest[800],
  },
  timelineNodeCurrent: {
    backgroundColor: colors.gold[500],
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e8e2d4',
    marginVertical: 2,
  },
  timelineLinePassed: {
    backgroundColor: colors.forest[800],
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718077',
  },
  stepTitlePassed: {
    color: '#14291f',
    fontWeight: '700',
  },
  stepTitleCurrent: {
    color: colors.forest[900],
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 11,
    color: '#8c9990',
    marginTop: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 12,
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courierIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f6f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  courierSub: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  addrRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addrRecipient: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  addrText: {
    fontSize: 12,
    color: '#344e41',
    marginTop: 2,
  },
  addrCity: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  itemImgWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ede6d8',
    overflow: 'hidden',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  noImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    lineHeight: 16,
  },
  itemPriceQty: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14291f',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  sumLabel: {
    fontSize: 13,
    color: '#718077',
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14291f',
  },
  sumTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1ebd8',
    marginTop: 6,
    paddingTop: 8,
  },
  sumTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
  },
  sumTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.forest[900],
  },
  cancelBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  returnBtn: {
    backgroundColor: '#edf6ee',
    borderWidth: 1,
    borderColor: '#bce0cb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  returnBtnText: {
    color: colors.forest[800],
    fontSize: 14,
    fontWeight: '700',
  },
});
