'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomer } from '../../../components/customer/CustomerContext';
import { customerApi } from '../../../lib/customer-api';
import { CustomerAddressItem, CheckoutPreviewData } from '@tobetake/shared-types';

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

function CheckoutContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponFromQuery = searchParams.get('coupon') || '';

  const { isAuthenticated, isInitialized, user, refreshCart } = useCustomer();

  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  // New Address Form State
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('+92 300 1234567');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('Lahore');
  const [newProvince, setNewProvince] = useState('Punjab');
  const [newPostalCode, setNewPostalCode] = useState('54000');

  // Checkout Options
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'JAZZCASH' | 'EASYPAISA' | 'RAAST' | 'BANK_TRANSFER'>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [couponCode, setCouponCode] = useState(couponFromQuery);

  const [preview, setPreview] = useState<CheckoutPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Check Auth & Load Addresses
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.push('/login/user?intent=checkout&redirect=' + encodeURIComponent('/checkout'));
      return;
    }

    async function initCheckout() {
      try {
        const addrList = await customerApi.getAddresses();
        setAddresses(addrList);
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setUseNewAddress(true);
          if (user) {
            setNewRecipient(`${user.firstName} ${user.lastName}`);
          }
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    }
    initCheckout();
  }, [isAuthenticated, isInitialized, router, user]);

  // 2. Refresh Preview when options change
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    async function loadPreview() {
      setLoadingPreview(true);
      try {
        const data = await customerApi.getCheckoutPreview({
          addressId: selectedAddressId || undefined,
          couponCode: couponCode || undefined,
          shippingMethod,
        });
        setPreview(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error calculating checkout preview.');
      } finally {
        setLoadingPreview(false);
      }
    }
    loadPreview();
  }, [isAuthenticated, isInitialized, selectedAddressId, couponCode, shippingMethod]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let phoneToUse = '';
    let shippingAddressPayload: any = undefined;

    if (useNewAddress || !selectedAddressId) {
      if (!newRecipient || !newPhone || !newStreet || !newCity) {
        setErrorMsg('Please fill in all required shipping address fields.');
        return;
      }
      phoneToUse = newPhone;
      shippingAddressPayload = {
        recipientName: newRecipient,
        phone: newPhone,
        streetAddress: newStreet,
        area: newArea,
        city: newCity,
        province: newProvince,
        postalCode: newPostalCode,
        country: 'Pakistan',
      };
    } else {
      const selected = addresses.find((a) => a.id === selectedAddressId);
      if (!selected) {
        setErrorMsg('Please select a delivery address.');
        return;
      }
      phoneToUse = selected.phone;
    }

    setSubmitting(true);
    try {
      const res = await customerApi.placeOrder({
        addressId: useNewAddress ? undefined : selectedAddressId,
        shippingAddress: shippingAddressPayload,
        paymentMethod,
        shippingMethod,
        customerNotes,
        couponCode: couponCode || undefined,
      });

      await refreshCart();
      router.push(`/orders/${res.orderId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (!isInitialized) {
    return (
      <div style={{ maxWidth: '1240px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: '#526359', fontSize: '1rem', fontWeight: 600 }}>Loading secure checkout...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8125rem', color: '#82948a', marginBottom: '1.5rem' }}>
        <Link href="/cart" style={{ color: '#526359' }}>← Back to Cart</Link> / <strong>Secure Checkout</strong>
      </div>

      <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f', marginBottom: '2rem' }}>
        Complete Your Order
      </h1>

      {errorMsg && (
        <div style={{ background: '#fdf2f2', border: '1px solid #f8c8c8', color: '#a82323', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left: Address, Delivery, Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 1. Delivery Address */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
              1. Pakistani Delivery Address
            </h2>

            {addresses.length > 0 && !useNewAddress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    style={{
                      border: '1.5px solid',
                      borderColor: selectedAddressId === a.id ? '#14291f' : '#e8e3d9',
                      background: selectedAddressId === a.id ? '#fdfcf7' : '#ffffff',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="addressSelect"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ fontSize: '0.875rem', color: '#14291f' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong>{a.recipientName}</strong>
                        <span style={{ fontSize: '0.75rem', background: '#f0ebe1', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {a.label}
                        </span>
                        {a.isDefault && (
                          <span style={{ fontSize: '0.6875rem', color: '#196338', fontWeight: 700 }}>Default</span>
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0 0', color: '#526359' }}>
                        {a.streetAddress}, {a.area ? `${a.area}, ` : ''}{a.city}, {a.province} - {a.postalCode}
                      </p>
                      <p style={{ margin: '0.15rem 0 0', color: '#82948a', fontSize: '0.75rem' }}>
                        Phone: {a.phone}
                      </p>
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => setUseNewAddress(true)}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#d4a34b', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', padding: '0.25rem 0' }}
                >
                  + Ship to a different address
                </button>
              </div>
            )}

            {(useNewAddress || addresses.length === 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bilal Ahmed"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    Pakistani Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    Area / Sector / Society
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DHA Phase 5 / Gulberg III"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    Street Address (House/Flat No., Street Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House 42, Street 8"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    City *
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  >
                    {PAKISTANI_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
                    Province *
                  </label>
                  <select
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
                  >
                    {PAKISTANI_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {addresses.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(false)}
                      style={{ background: 'none', border: 'none', color: '#14291f', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ← Back to saved addresses
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Courier Shipping Method */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
              2. Courier & Delivery Method
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: shippingMethod === 'STANDARD' ? '#14291f' : '#e8e3d9',
                  background: shippingMethod === 'STANDARD' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'STANDARD'}
                    onChange={() => setShippingMethod('STANDARD')}
                  />
                  <div>
                    <strong>TCS Express Standard Delivery</strong>
                    <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.15rem 0 0' }}>
                      2 - 3 business days across Pakistan
                    </p>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: preview?.shippingFee === 0 ? '#196338' : '#14291f', fontSize: '0.875rem' }}>
                  {preview?.shippingFee === 0 ? 'FREE' : 'Rs. 200'}
                </span>
              </label>

              <label
                style={{
                  border: '1.5px solid',
                  borderColor: shippingMethod === 'EXPRESS' ? '#14291f' : '#e8e3d9',
                  background: shippingMethod === 'EXPRESS' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === 'EXPRESS'}
                    onChange={() => setShippingMethod('EXPRESS')}
                  />
                  <div>
                    <strong>Leopards Overnight Priority Express</strong>
                    <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.15rem 0 0' }}>
                      1 - 2 business days fast transit
                    </p>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#14291f', fontSize: '0.875rem' }}>
                  Rs. 350
                </span>
              </label>
            </div>
          </div>

          {/* 3. Pakistani Payment Method */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
              3. Payment Method
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* COD */}
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: paymentMethod === 'COD' ? '#14291f' : '#e8e3d9',
                  background: paymentMethod === 'COD' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <strong>💵 Cash on Delivery (COD)</strong>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                    Pay with physical cash to the courier rider upon parcel arrival at your doorstep.
                  </p>
                </div>
              </label>

              {/* JazzCash */}
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: paymentMethod === 'JAZZCASH' ? '#14291f' : '#e8e3d9',
                  background: paymentMethod === 'JAZZCASH' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'JAZZCASH'}
                  onChange={() => setPaymentMethod('JAZZCASH')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <strong>📱 JazzCash Mobile Wallet</strong>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                    Instant digital payment via your registered JazzCash mobile account (+92 30X).
                  </p>
                </div>
              </label>

              {/* EasyPaisa */}
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: paymentMethod === 'EASYPAISA' ? '#14291f' : '#e8e3d9',
                  background: paymentMethod === 'EASYPAISA' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'EASYPAISA'}
                  onChange={() => setPaymentMethod('EASYPAISA')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <strong>🟢 Easypaisa Mobile Account / QR</strong>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                    Direct checkout through Telenor Easypaisa wallet balance or debit card.
                  </p>
                </div>
              </label>

              {/* Raast */}
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: paymentMethod === 'RAAST' ? '#14291f' : '#e8e3d9',
                  background: paymentMethod === 'RAAST' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAAST'}
                  onChange={() => setPaymentMethod('RAAST')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <strong>⚡ Raast Instant P2M (SBP)</strong>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                    State Bank of Pakistan real-time zero fee bank settlement.
                  </p>
                </div>
              </label>

              {/* Bank Transfer */}
              <label
                style={{
                  border: '1.5px solid',
                  borderColor: paymentMethod === 'BANK_TRANSFER' ? '#14291f' : '#e8e3d9',
                  background: paymentMethod === 'BANK_TRANSFER' ? '#fdfcf7' : '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <strong>🏛️ Direct 1Link Bank Transfer (IBFT)</strong>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                    Meezan Bank / Habib Bank Limited (HBL) / Habib Metropolitan.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.4rem' }}>
              Special Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Ring doorbell twice, deliver after 2:00 PM..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* Right: Order Summary Breakdown */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e8e3d9',
            borderRadius: '16px',
            padding: '1.75rem',
            position: 'sticky',
            top: '120px',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', marginBottom: '1.25rem' }}>
            Order Overview
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#526359', marginBottom: '0.75rem' }}>
            <span>Subtotal ({preview?.itemsCount || 0} items)</span>
            <span style={{ fontWeight: 700, color: '#14291f' }}>Rs. {(preview?.subtotal || 0).toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#526359', marginBottom: '0.75rem' }}>
            <span>Courier Shipping</span>
            <span style={{ fontWeight: 700, color: preview?.shippingFee === 0 ? '#196338' : '#14291f' }}>
              {preview?.shippingFee === 0 ? 'FREE' : `Rs. ${preview?.shippingFee}`}
            </span>
          </div>

          {preview?.discount && preview.discount > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#196338', marginBottom: '0.75rem' }}>
              <span>Voucher Savings ({preview.couponApplied})</span>
              <span style={{ fontWeight: 700 }}>- Rs. {preview.discount.toLocaleString()}</span>
            </div>
          ) : null}

          <div style={{ height: '1px', background: '#f0ebe1', margin: '1rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#14291f' }}>Final Total</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14291f' }}>
              Rs. {(preview?.grandTotal || 0).toLocaleString()}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingPreview}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.95rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '1rem',
            }}
          >
            {submitting ? 'Placing Your Order...' : 'Confirm & Place Order'}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#82948a', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
            By placing this order, you agree to ToBeTake Pakistan’s terms and 7-day return policy.
          </p>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
