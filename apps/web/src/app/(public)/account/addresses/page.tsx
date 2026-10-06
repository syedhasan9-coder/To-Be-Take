'use client';

import React, { useEffect, useState } from 'react';
import { customerApi } from '../../../../lib/customer-api';
import { CustomerAddressItem } from '@tobetake/shared-types';

const PAKISTANI_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Swat',
];

const PAKISTANI_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
];

export default function AccountAddressesPage(): React.ReactElement {
  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [streetAddress, setStreetAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Lahore');
  const [province, setProvince] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('54000');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('+92 300 1234567');
    setStreetAddress('');
    setArea('');
    setCity('Lahore');
    setProvince('Punjab');
    setPostalCode('54000');
    setIsDefault(addresses.length === 0);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddressItem) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setArea(addr.area || '');
    setCity(addr.city);
    setProvince(addr.province);
    setPostalCode(addr.postalCode || '54000');
    setIsDefault(addr.isDefault);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await customerApi.updateAddress(editingId, {
          label,
          recipientName,
          phone,
          streetAddress,
          area,
          city,
          province,
          postalCode,
          isDefault,
        });
      } else {
        await customerApi.createAddress({
          label,
          recipientName,
          phone,
          streetAddress,
          area,
          city,
          province,
          postalCode,
          isDefault,
        });
      }
      setModalOpen(false);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await customerApi.setDefaultAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to set default address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await customerApi.deleteAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.75rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
            Delivery Address Book
          </h1>
          <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Manage Pakistani shipping addresses for swift 1-click checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary"
          style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.8125rem' }}
        >
          + Add New Address
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#526359' }}>Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>📍</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.35rem' }}>
            No saved addresses
          </h3>
          <p style={{ color: '#82948a', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            Add your primary residence or workplace delivery address.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: '9999px', fontSize: '0.8125rem' }}
          >
            + Add First Address
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                border: '1.5px solid',
                borderColor: addr.isDefault ? '#14291f' : '#e8e3d9',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: addr.isDefault ? '#fdfcf7' : '#ffffff',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#f0ebe1', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span style={{ fontSize: '0.6875rem', background: '#e6f4ec', color: '#196338', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      ✓ Default Address
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.25rem' }}>
                  {addr.recipientName}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#526359', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                  {addr.streetAddress}, {addr.area ? `${addr.area}, ` : ''}{addr.city}, {addr.province} - {addr.postalCode}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#82948a', margin: 0 }}>
                  Phone: <strong>{addr.phone}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f0ebe1' }}>
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: '#14291f', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(addr)}
                  style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a34b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: addr.isDefault ? '0' : 'auto' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a82323', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '0.75rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.4rem', fontWeight: 700, color: '#14291f', marginBottom: '1.25rem' }}>
              {editingId ? 'Edit Address' : 'Add New Pakistani Address'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Address Label
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office / Workplace</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmed"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Mobile Phone Number (+92) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Street Address (House, Flat, Street) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House 42, Street 8"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Area / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 5"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="54000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  City *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                >
                  {PAKISTANI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                  Province *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                >
                  {PAKISTANI_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#14291f', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <span>Make this my default shipping address</span>
                </label>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
