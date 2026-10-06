'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';
import { useCustomer } from './CustomerContext';

interface ProductCardProps {
  product: CustomerStorefrontProduct;
  featured?: boolean;
}

export function ProductCard({ product, featured }: ProductCardProps): React.ReactElement {
  const { addToCart, isWishlisted, toggleWishlist } = useCustomer();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=500';
  const wish = isWishlisted(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch {
      // Handled
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const formattedPrice = Number(product.price).toLocaleString();
  const formattedComparePrice = product.compareAtPrice ? Number(product.compareAtPrice).toLocaleString() : null;

  return (
    <div className={`customer-product-card ${featured ? 'card-featured' : ''}`}>
      <Link href={`/products/${product.slug || product.id}`} className="card-image-wrap">
        {/* Badges */}
        <div className="card-badge-row">
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="card-badge badge-discount">-{product.discountPercent}%</span>
          )}
          {product.isNew && (
            <span className="card-badge badge-new">New</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          className={`card-wishlist-btn ${wish ? 'wishlisted' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={wish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg viewBox="0 0 24 24" fill={wish ? '#E05D5D' : 'none'} stroke={wish ? '#E05D5D' : '#14291f'} strokeWidth="2" className="heart-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Product Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={product.name || 'Artisanal Product Image'}
          className="product-img"
          loading="lazy"
        />

        {/* Stock Badge Overlay if low or out of stock */}
        {!product.inStock && (
          <div className="out-of-stock-overlay">
            <span>Sold Out</span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="card-body">
        {/* Store / Merchant Tag & Rating */}
        <div className="card-store-row">
          <span className="store-tag" title={product.storeName || product.sellerName || 'Verified Merchant'}>
            <span className="store-leaf">🌿</span> {product.storeName || product.sellerName || 'Verified Merchant'}
          </span>
          {product.rating > 0 && (
            <div className="rating-pill" title={`${product.rating} stars`}>
              <span className="star-icon">★</span>
              <span className="rating-val">{Number(product.rating).toFixed(1)}</span>
              {product.reviewCount > 0 && <span className="rating-count">({product.reviewCount})</span>}
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${product.slug || product.id}`} className="card-title-link">
          <h3 className="card-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Price Row & Add to Cart */}
        <div className="card-footer-row">
          <div className="price-stack">
            <div className="main-price">
              <span className="currency-prefix">Rs.</span>
              <span className="price-num">{formattedPrice}</span>
            </div>
            {formattedComparePrice && (
              <span className="compare-price">Rs. {formattedComparePrice}</span>
            )}
          </div>

          <button
            type="button"
            className={`card-cart-btn ${addedSuccess ? 'btn-success' : ''}`}
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            aria-label={product.inStock ? `Add ${product.name} to cart` : 'Out of stock'}
          >
            {isAdding ? (
              <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : addedSuccess ? (
              <span>✓ Added</span>
            ) : (
              <span>+ Add</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
