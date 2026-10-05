import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuth } from '../context/AuthContext';
import { AppIcon } from '../components/AppIcon';

interface CartScreenProps {
  onNavigateToCatalog: () => void;
  onNavigateToCheckout: () => void;
  onNavigateToProduct: (productId: string) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onNavigateToCatalog,
  onNavigateToCheckout,
  onNavigateToProduct,
}) => {
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCustomerCart();
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.emptyIconBg}>
          <AppIcon name="cart-outline" size={32} color={colors.forest[800]} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Waiting</Text>
        <Text style={styles.emptySub}>Please sign in to view and manage your shopping bag.</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onNavigateToCatalog}
          accessibilityRole="button"
          accessibilityLabel="Explore Products"
        >
          <Text style={styles.actionBtnText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const freeShippingThreshold = 3000;
  const progress = Math.min(1, subtotal / freeShippingThreshold);
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);

  const handleUpdate = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    if (newQty <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQty);
    }
    setUpdatingId(null);
  };

  const handleClear = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCart();
        },
      },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.emptyIconBg}>
          <AppIcon name="cart-outline" size={36} color={colors.forest[800]} />
        </View>
        <Text style={styles.emptyTitle}>Your Shopping Bag is Empty</Text>
        <Text style={styles.emptySub}>
          Discover pure cold-pressed oils, Himalayan salt treasures, and artisan pottery.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onNavigateToCatalog}
          accessibilityRole="button"
          accessibilityLabel="Start shopping"
        >
          <Text style={styles.actionBtnText}>Start Shopping →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Shopping Cart ({cart?.totalItems || 0})</Text>
        <TouchableOpacity
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear cart"
        >
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Free Shipping Progress Indicator */}
        <View style={styles.shippingBanner}>
          <View style={styles.shippingHeader}>
            <AppIcon name={amountNeeded === 0 ? "check" : "delivery"} size={16} color={colors.forest[800]} />
            <Text style={styles.shippingTitle}>
              {amountNeeded === 0
                ? 'You unlocked FREE Nationwide Delivery!'
                : `Add Rs. ${amountNeeded.toLocaleString('en-PK')} more for FREE delivery`}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Cart Items List */}
        <View style={styles.itemsList}>
          {items.map((item) => {
            const isItemUpdating = updatingId === item.id;
            return (
              <View key={item.id} style={styles.itemCard}>
                <TouchableOpacity
                  onPress={() => onNavigateToProduct(item.productId)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemImageWrapper}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noImage}>
                        <AppIcon name="leaf" size={24} color={colors.forest[400]} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <TouchableOpacity
                    onPress={() => onNavigateToProduct(item.productId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.itemPrice}>
                    Rs. {item.price.toLocaleString('en-PK')}
                  </Text>

                  <View style={styles.itemControls}>
                    {/* Stepper */}
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdate(item.id, item.quantity - 1)}
                        disabled={isItemUpdating}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                      >
                        <AppIcon name={item.quantity === 1 ? 'trash' : 'minus'} size={14} color={colors.forest[900]} />
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleUpdate(item.id, item.quantity + 1)}
                        disabled={isItemUpdating}
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                      >
                        <AppIcon name="plus" size={14} color={colors.forest[900]} />
                      </TouchableOpacity>
                    </View>

                    {/* Line Total */}
                    <Text style={styles.lineTotal}>
                      Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupon Code Strip */}
        <View style={styles.couponCard}>
          <Text style={styles.couponHeading}>Have a Promo Coupon?</Text>
          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="e.g. HERITAGE10"
              placeholderTextColor="#8c9990"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.couponBtn, couponApplied && styles.couponBtnApplied]}
              onPress={() => {
                if (couponCode.trim()) {
                  setCouponApplied(true);
                  Alert.alert('Coupon Applied', 'Promo code HERITAGE10 applied successfully!');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Apply coupon"
            >
              <Text style={styles.couponBtnText}>
                {couponApplied ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs. {subtotal.toLocaleString('en-PK')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery (TCS)</Text>
            <Text style={styles.summaryValue}>
              {amountNeeded === 0 ? 'FREE' : 'Rs. 250'}
            </Text>
          </View>

          {couponApplied && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.forest[700] }]}>
                Discount (10%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.forest[700] }]}>
                -Rs. {Math.round(subtotal * 0.1).toLocaleString('en-PK')}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>
              Rs.{' '}
              {Math.max(
                0,
                subtotal + (amountNeeded === 0 ? 0 : 250) - (couponApplied ? subtotal * 0.1 : 0),
              ).toLocaleString('en-PK')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Checkout CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>
            Rs.{' '}
            {Math.max(
              0,
              subtotal + (amountNeeded === 0 ? 0 : 250) - (couponApplied ? subtotal * 0.1 : 0),
            ).toLocaleString('en-PK')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={onNavigateToCheckout}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
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
    padding: 32,
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
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#718077',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 260,
  },
  actionBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b84218',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  shippingBanner: {
    backgroundColor: '#eef6f0',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ebd9',
  },
  shippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shippingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest[800],
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#cbe7d0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.forest[700],
    borderRadius: 3,
  },
  itemsList: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1ebd8',
    gap: 12,
  },
  itemImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#ede6d8',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest[800],
    marginBottom: 8,
  },
  itemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    borderRadius: 6,
    backgroundColor: '#f8f5ee',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepperQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    minWidth: 24,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
  },
  couponCard: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dbc9',
  },
  couponHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#14291f',
  },
  couponBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  couponBtnApplied: {
    backgroundColor: '#2e7d32',
  },
  couponBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dbc9',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#718077',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14291f',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1ebd8',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14291f',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.forest[900],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2dbc9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: '#718077',
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.forest[900],
  },
  checkoutBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
