import React, { useState, useEffect, useCallback } from 'react';
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
import { CustomerAddressItem } from '@tobetake/shared-types';
import {
  getCustomerAddresses,
  createCustomerAddress,
  deleteCustomerAddress,
} from '../services/api';
import { AppIcon } from '../components/AppIcon';

interface AddressesScreenProps {
  onNavigateBack: () => void;
}

export const AddressesScreen: React.FC<AddressesScreenProps> = ({ onNavigateBack }) => {
  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [label, setLabel] = useState<string>('Home');
  const [recipientName, setRecipientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+92 3');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Karachi');
  const [province, setProvince] = useState<string>('Sindh');
  const [postalCode, setPostalCode] = useState<string>('74200');

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSave = async () => {
    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim()) {
      Alert.alert('Required Fields', 'Please complete recipient name, phone, and street address.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCustomerAddress({
        label,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        city,
        province,
        postalCode,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setShowAdd(false);
      setRecipientName('');
      setStreetAddress('');
      Alert.alert('Address Saved', 'New Pakistani delivery address has been saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomerAddress(id);
            setAddresses((prev) => prev.filter((a) => a.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  if (loading && !showAdd) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Loading saved addresses...</Text>
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
        <Text style={styles.topTitle}>Delivery Addresses</Text>
        <TouchableOpacity
          onPress={() => setShowAdd(!showAdd)}
          accessibilityRole="button"
          accessibilityLabel={showAdd ? 'Cancel add address' : 'Add new address'}
        >
          <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showAdd && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Delivery Address</Text>

            <View style={styles.labelPicker}>
              {['Home', 'Office', 'Other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, label === l && styles.activeLabelChip]}
                  onPress={() => setLabel(l)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.labelChipText, label === l && styles.activeLabelChipText]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Recipient Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fatima Tariq"
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

            <Text style={styles.inputLabel}>Street Address, House #, Block *</Text>
            <TextInput
              style={styles.input}
              placeholder="House 45, Sector F-7/2"
              value={streetAddress}
              onChangeText={setStreetAddress}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Islamabad"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="44000"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save address"
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : 'Save Delivery Address'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && !showAdd ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIconBg}>
              <AppIcon name="location" size={36} color={colors.forest[800]} />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Saved</Text>
            <Text style={styles.emptySub}>
              Save your home or office address in Pakistan for swift 1-click checkout.
            </Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => setShowAdd(true)}
              accessibilityRole="button"
              accessibilityLabel="Add first address"
            >
              <Text style={styles.addFirstBtnText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((addr) => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.labelRow}>
                    <View style={styles.locIconBg}>
                      <AppIcon name="location" size={14} color={colors.forest[800]} />
                    </View>
                    <Text style={styles.addressLabel}>{addr.label || 'Home'}</Text>
                    {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(addr.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete address"
                  >
                    <AppIcon name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.recipientName}>{addr.recipientName}</Text>
                <Text style={styles.streetText}>{addr.streetAddress}</Text>
                <Text style={styles.cityText}>
                  {addr.city}, {addr.province} {addr.postalCode ? `(${addr.postalCode})` : ''}
                </Text>
                <View style={styles.phoneRow}>
                  <AppIcon name="phone" size={13} color="#718077" />
                  <Text style={styles.phoneText}>{addr.phone}</Text>
                </View>
              </View>
            ))}
          </View>
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
    marginBottom: 20,
  },
  addFirstBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addFirstBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest[700],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    gap: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 4,
  },
  labelPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  labelChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  activeLabelChip: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344e41',
  },
  activeLabelChipText: {
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
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
  saveBtn: {
    backgroundColor: colors.forest[800],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#edf6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '800',
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
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 2,
  },
  streetText: {
    fontSize: 13,
    color: '#344e41',
    lineHeight: 18,
    marginBottom: 2,
  },
  cityText: {
    fontSize: 12,
    color: '#718077',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#718077',
  },
});
