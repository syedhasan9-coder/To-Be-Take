import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  CustomerAddressItem,
  CustomerPaymentMethodType,
  CheckoutPreviewData,
} from '@tobetake/shared-types';
import {
  getCustomerAddresses,
  createCustomerAddress,
  getCheckoutPreview,
  placeCustomerOrder,
} from '../services/api';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon } from '../components/AppIcon';
import { formatRs } from '../utils/formatters';

interface CheckoutScreenProps {
  onNavigateBack: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onNavigateBack,
  onOrderPlaced,
}) => {
  const { cart, refreshCart } = useCustomerCart();
  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethodType>('COD');
  const [preview, setPreview] = useState<CheckoutPreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);

  // Add Address Modal / Inline Form
  const [showAddAddress, setShowAddAddress] = useState<boolean>(false);
  const [recipientName, setRecipientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+92 3');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Karachi');
  const [province, setProvince] = useState<string>('Sindh');
  const [postalCode, setPostalCode] = useState<string>('74200');
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  useEffect(() => {
    async function initCheckout() {
      try {
        setLoading(true);
        const [addrList, previewData] = await Promise.all([
          getCustomerAddresses(),
          getCheckoutPreview({ shippingMethod }),
        ]);
        setAddresses(addrList);
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
          setSelectedAddressId(defaultAddr.id);
        }
        setPreview(previewData);
      } catch (err) {
        console.error('Failed to init checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    initCheckout();
  }, [shippingMethod]);

  const handleCreateAddress = async () => {
    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim()) {
      Alert.alert('Required Fields', 'Please fill in recipient name, phone number, and street address.');
      return;
    }
    setSavingAddress(true);
    try {
      const newAddr = await createCustomerAddress({
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        city,
        province,
        postalCode,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [newAddr, ...prev]);
      setSelectedAddressId(newAddr.id);
      setShowAddAddress(false);
      setRecipientName('');
      setStreetAddress('');
      Alert.alert('Success', 'Delivery address saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && addresses.length === 0) {
      Alert.alert('Address Required', 'Please add or select a delivery address in Pakistan.');
      return;
    }

    setPlacingOrder(true);
    try {
      const result = await placeCustomerOrder({
        addressId: selectedAddressId || undefined,
        paymentMethod,
        shippingMethod,
      });

      await refreshCart();
      Alert.alert('Order Confirmed!', `Your order #${result.orderNumber} has been successfully placed.`);
      onOrderPlaced(result.orderId);
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Unable to place order. Please check your details.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Preparing secure Pakistani checkout...</Text>
      </View>
    );
  }

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  const totalAmount = preview?.grandTotal || cart?.grandTotal || 0;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onNavigateBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={20} color="#14291f" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Secure Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Delivery Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="location" size={16} color={colors.forest[800]} />
              <Text style={styles.sectionTitle}>1. Delivery Address (Pakistan)</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddAddress(!showAddAddress)}>
              <Text style={styles.addAddrText}>
                {showAddAddress ? 'Cancel' : '+ Add Address'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddAddress ? (
            <View style={styles.addressForm}>
              <Text style={styles.inputLabel}>Recipient Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Bilal Ahmed"
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <Text style={styles.inputLabel}>Pakistani Phone Number (+92) *</Text>
              <TextInput
                style={styles.input}
                placeholder="+92 300 1234567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Complete Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="House #12, Block 4, Clifton"
                value={streetAddress}
                onChangeText={setStreetAddress}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Karachi"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="74200"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveAddrBtn}
                onPress={handleCreateAddress}
                disabled={savingAddress}
                accessibilityRole="button"
                accessibilityLabel="Save address"
              >
                <Text style={styles.saveAddrText}>
                  {savingAddress ? 'Saving Address...' : 'Save & Use Address'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.addressItem, isSelected && styles.selectedAddressItem]}
                    onPress={() => setSelectedAddressId(addr.id)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.radio}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.addrTextCol}>
                      <View style={styles.addrNameRow}>
                        <Text style={styles.addrRecipient}>{addr.recipientName}</Text>
                        {addr.isDefault && (
                          <Text style={styles.defaultBadge}>Default</Text>
                        )}
                      </View>
                      <Text style={styles.addrStreet}>{addr.streetAddress}</Text>
                      <Text style={styles.addrCity}>
                        {addr.city}, {addr.province} • {addr.phone}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Shipping Courier */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="delivery" size={16} color={colors.forest[800]} />
            <Text style={styles.sectionTitle}>2. Courier & Delivery Speed</Text>
          </View>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[styles.optionCard, shippingMethod === 'STANDARD' && styles.selectedOption]}
              onPress={() => setShippingMethod('STANDARD')}
              activeOpacity={0.8}
            >
              <View style={styles.radio}>
                {shippingMethod === 'STANDARD' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>TCS Express (Standard 2-4 Days)</Text>
                <Text style={styles.optionSub}>Direct doorstep delivery across all Pakistani cities</Text>
              </View>
              <Text style={styles.optionFee}>
                {preview?.shippingFee === 0 ? 'FREE' : 'Rs. 250'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, shippingMethod === 'EXPRESS' && styles.selectedOption]}
              onPress={() => setShippingMethod('EXPRESS')}
              activeOpacity={0.8}
            >
              <View style={styles.radio}>
                {shippingMethod === 'EXPRESS' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Leopards Priority (1-2 Days)</Text>
                <Text style={styles.optionSub}>Fast-track courier dispatch with live tracking</Text>
              </View>
              <Text style={styles.optionFee}>Rs. 450</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 3: Payment Method */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="card" size={16} color={colors.forest[800]} />
            <Text style={styles.sectionTitle}>3. Payment Method (Pakistan)</Text>
          </View>
          <View style={styles.optionsList}>
            {[
              { key: 'COD', title: 'Cash on Delivery (COD)', sub: 'Pay cash to TCS/Leopards courier upon delivery' },
              { key: 'JAZZCASH', title: 'JazzCash Mobile Wallet', sub: 'Instant mobile account payment' },
              { key: 'EASYPAISA', title: 'EasyPaisa Wallet', sub: 'Quick payment via EasyPaisa app or OTP' },
              { key: 'RAAST', title: 'Raast (State Bank of Pakistan)', sub: 'Zero-fee instant bank transfer' },
              { key: 'BANK_TRANSFER', title: '1Link Direct Bank Transfer', sub: 'Online banking IBFT transfer' },
            ].map((method) => {
              const isSelected = paymentMethod === method.key;
              return (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.optionCard, isSelected && styles.selectedOption]}
                  onPress={() => setPaymentMethod(method.key as CustomerPaymentMethodType)}
                  activeOpacity={0.8}
                >
                  <View style={styles.radio}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{method.title}</Text>
                    <Text style={styles.optionSub}>{method.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 4: Final Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Order Review</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>
              Rs. {formatRs(preview?.subtotal || cart?.subtotal || 0)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Courier Shipping</Text>
            <Text style={styles.summaryVal}>
              {preview?.shippingFee === 0 ? 'FREE' : `Rs. ${formatRs(preview?.shippingFee || 250)}`}
            </Text>
          </View>

          {preview?.discount ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#137333' }]}>Coupon Discount</Text>
              <Text style={[styles.summaryVal, { color: '#137333' }]}>
                - Rs. {formatRs(preview.discount)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable (PKR)</Text>
            <Text style={styles.totalVal}>Rs. {formatRs(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Place Order Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Payable Total</Text>
          <Text style={styles.bottomPrice}>Rs. {formatRs(totalAmount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Place Order"
        >
          <Text style={styles.placeOrderText}>
            {placingOrder ? 'Confirming Order...' : 'Place Order Now →'}
          </Text>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14291f',
  },
  addAddrText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest[700],
  },
  addressList: {
    gap: 10,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    backgroundColor: '#f8f5ee',
    gap: 12,
  },
  selectedAddressItem: {
    borderColor: colors.forest[800],
    backgroundColor: '#edf6ee',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.forest[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.forest[800],
  },
  addrTextCol: {
    flex: 1,
  },
  addrNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addrRecipient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
  },
  defaultBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forest[800],
    backgroundColor: '#d6ebd9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  addrStreet: {
    fontSize: 12,
    color: '#344e41',
    lineHeight: 16,
  },
  addrCity: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  addressForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#14291f',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  saveAddrBtn: {
    backgroundColor: colors.forest[800],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveAddrText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    backgroundColor: '#f8f5ee',
    gap: 12,
  },
  selectedOption: {
    borderColor: colors.forest[800],
    backgroundColor: '#edf6ee',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11,
    color: '#718077',
  },
  optionFee: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.forest[800],
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
  summaryVal: {
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
  totalVal: {
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
  bottomLabel: {
    fontSize: 11,
    color: '#718077',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.forest[900],
  },
  placeOrderBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  disabledBtn: {
    backgroundColor: '#d6cfc2',
  },
  placeOrderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
