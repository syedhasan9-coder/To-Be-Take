'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer } from '../../../components/customer/CustomerContext';

export default function CartPage(): React.ReactElement {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, clearCart, isAuthenticated } = useCustomer();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);
  const freeShippingThreshold = 3000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : (subtotal > 0 ? 200 : 0);
  const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'PAKISTAN15') {
      const disc = Math.round(subtotal * 0.15);
      setDiscountAmount(disc);
      setAppliedCoupon('PAKISTAN15 (15% Off)');
    } else if (code === 'WELCOME10') {
      const disc = Math.round(subtotal * 0.10);
      setDiscountAmount(disc);
      setAppliedCoupon('WELCOME10 (10% Off)');
    } else {
      setCouponError('Invalid voucher code. Try PAKISTAN15 or WELCOME10.');
    }
  };

  const handleProceedCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login/user?intent=checkout&redirect=' + encodeURIComponent('/checkout'));
    } else {
      const query = appliedCoupon ? `?coupon=${couponCode.trim().toUpperCase()}` : '';
      router.push(`/checkout${query}`);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e8e3d9' }}>
        <span style={{ fontSize: '3.5rem' }}>🛒</span>
        <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.8rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
          Your Shopping Cart is Empty
        </h2>
        <p style={{ color: '#526359', fontSize: '0.9375rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
          Explore handcrafted Multan ceramics, pure Swat botanicals, and high grade tech with fast nationwide delivery.
        </p>
        <Link href="/products" className="btn-primary" style={{ padding: '0.75rem 1.75rem', borderRadius: '9999px', fontWeight: 700 }}>
          Discover Marketplace Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          Shopping Cart ({cart?.totalItems || 0} items)
        </h1>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Review items and proceed to secure checkout across Pakistan.
        </p>
      </div>

      {/* Free Shipping Progress Alert */}
      <div
        style={{
          background: remainingForFreeShipping === 0 ? '#e6f4ec' : '#fff8f0',
          border: '1px solid',
          borderColor: remainingForFreeShipping === 0 ? '#b6e2c8' : '#fed7aa',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontSize: '1.35rem' }}>{remainingForFreeShipping === 0 ? '🎉' : '🚚'}</span>
        <div style={{ fontSize: '0.875rem' }}>
          {remainingForFreeShipping === 0 ? (
            <span style={{ color: '#196338', fontWeight: 700 }}>
              Congratulations! You have qualified for <strong>FREE Nationwide Delivery</strong>.
            </span>
          ) : (
            <span style={{ color: '#966b18', fontWeight: 600 }}>
              Add <strong>Rs. {remainingForFreeShipping.toLocaleString()}</strong> more to your cart to get <strong>FREE Delivery</strong> across Pakistan!
            </span>
          )}
        </div>
      </div>

      {/* Grid: Cart Items (Left) + Summary (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Cart Items Table / List */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0ebe1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#14291f', fontSize: '0.9375rem' }}>Cart Products</span>
            <button
              type="button"
              onClick={clearCart}
              style={{ fontSize: '0.75rem', color: '#a82323', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear Cart
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f0ebe1',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'center',
                }}
              >
                {/* Image */}
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: '#f8f5ee', overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <Link href={`/products/${item.productSlug || item.productId}`} style={{ textDecoration: 'none', color: '#14291f' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                      {item.productName}
                    </h3>
                  </Link>
                  <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0 0 0.5rem' }}>
                    Merchant: <strong>{item.storeName || item.sellerName}</strong>
                  </p>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#14291f' }}>
                    Rs. {Number(item.price).toLocaleString()}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #dcd5c7', borderRadius: '9999px', background: '#f8f5ee' }}>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#14291f', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ padding: '0 0.35rem', fontWeight: 700, fontSize: '0.875rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#14291f', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div style={{ minWidth: '90px', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#14291f' }}>
                    Rs. {Number(item.itemTotal).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    style={{ fontSize: '0.75rem', color: '#82948a', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', marginBottom: '1.25rem' }}>
            Order Summary
          </h3>

          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#526359', marginBottom: '0.75rem' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 700, color: '#14291f' }}>Rs. {subtotal.toLocaleString()}</span>
          </div>

          {/* Shipping */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#526359', marginBottom: '0.75rem' }}>
            <span>Shipping across Pakistan</span>
            <span style={{ fontWeight: 700, color: shippingFee === 0 ? '#196338' : '#14291f' }}>
              {shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}`}
            </span>
          </div>

          {/* Discount if applied */}
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#196338', marginBottom: '0.75rem' }}>
              <span>Voucher Discount ({appliedCoupon})</span>
              <span style={{ fontWeight: 700 }}>- Rs. {discountAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: '#f0ebe1', margin: '1rem 0' }} />

          {/* Grand Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#14291f' }}>Grand Total</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14291f' }}>
              Rs. {grandTotal.toLocaleString()}
            </span>
          </div>

          {/* Voucher Promo Input */}
          <form onSubmit={handleApplyCoupon} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#526359', marginBottom: '0.35rem' }}>
              Voucher Code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="e.g. PAKISTAN15"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '8px',
                  border: '1px solid #dcd5c7',
                  background: '#f8f5ee',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  background: '#14291f',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Apply
              </button>
            </div>
            {couponError && <p style={{ color: '#a82323', fontSize: '0.75rem', margin: '0.35rem 0 0' }}>{couponError}</p>}
          </form>

          {/* Checkout CTA */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleProceedCheckout}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.9375rem',
              marginBottom: '1rem',
            }}
          >
            🔒 Proceed to Checkout
          </button>

          <p style={{ fontSize: '0.6875rem', color: '#82948a', textAlign: 'center', margin: 0 }}>
            Supports Cash on Delivery, JazzCash, EasyPaisa, Raast & Online Bank Transfer.
          </p>
        </div>
      </div>
    </div>
  );
}
