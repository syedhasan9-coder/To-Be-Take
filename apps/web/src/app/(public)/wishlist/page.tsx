'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer } from '../../../components/customer/CustomerContext';

export default function WishlistPage(): React.ReactElement {
  const router = useRouter();
  const { wishlist, removeFromWishlist, addToCart, isAuthenticated, isInitialized } = useCustomer();

  if (!isInitialized) {
    return (
      <div style={{ maxWidth: '1320px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: '#526359', fontSize: '1rem', fontWeight: 600 }}>Loading saved wishlist...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e8e3d9' }}>
        <span style={{ fontSize: '3rem' }}>❤️</span>
        <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.8rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
          Sign in to view your saved wishlist
        </h2>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Keep track of your favorite Multan pottery, Swat botanicals, and lifestyle goods.
        </p>
        <Link href="/login/user?redirect=/wishlist" className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px' }}>
          Sign In / Register
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e8e3d9' }}>
        <span style={{ fontSize: '3.5rem' }}>❤️</span>
        <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.8rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
          Your Wishlist is Empty
        </h2>
        <p style={{ color: '#526359', fontSize: '0.9375rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
          Save items you love by tapping the heart icon on any product card in our marketplace.
        </p>
        <Link href="/products" className="btn-primary" style={{ padding: '0.75rem 1.75rem', borderRadius: '9999px', fontWeight: 700 }}>
          Explore Products Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          My Saved Wishlist ({wishlist.length})
        </h1>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Items saved for your future shopping sessions across Pakistan.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {wishlist.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e8e3d9',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(20, 41, 31, 0.04)',
            }}
          >
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeFromWishlist(item.productId)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #e8e3d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                cursor: 'pointer',
                zIndex: 2,
              }}
              title="Remove from wishlist"
            >
              ✕
            </button>

            {/* Image */}
            <Link href={`/products/${item.productSlug || item.productId}`} style={{ display: 'block', width: '100%', paddingTop: '100%', position: 'relative', background: '#f8f5ee' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.productName}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Link>

            {/* Info */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#d4a34b', fontWeight: 600 }}>
                  🌿 {item.storeName || 'Verified Merchant'}
                </span>
                <Link href={`/products/${item.productSlug || item.productId}`} style={{ textDecoration: 'none', color: '#14291f' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0.35rem 0 0.5rem', lineHeight: 1.35 }}>
                    {item.productName}
                  </h3>
                </Link>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#14291f', marginBottom: '0.75rem' }}>
                  Rs. {Number(item.price).toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    await addToCart(item.productId, 1);
                    await removeFromWishlist(item.productId);
                    router.push('/cart');
                  }}
                  disabled={!item.inStock}
                  style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  {item.inStock ? 'Move to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
