'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomerProductDetail } from '@tobetake/shared-types';
import { customerApi } from '../../../../lib/customer-api';
import { useCustomer } from '../../../../components/customer/CustomerContext';
import { ProductCard } from '../../../../components/customer/ProductCard';

export default function ProductDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const { addToCart, buyNow, isWishlisted, toggleWishlist, isAuthenticated } = useCustomer();

  const [product, setProduct] = useState<CustomerProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await customerApi.getProductDetail(idOrSlug);
        setProduct(res);
        if (res.images && res.images.length > 0) {
          setSelectedImage(res.images[0]);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    }
    if (idOrSlug) loadProduct();
  }, [idOrSlug]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1320px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#526359' }}>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: '#526359', margin: '1rem 0 1.5rem' }}>
          The product you are looking for does not exist or has been removed from the catalog.
        </p>
        <Link href="/products" className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const wish = isWishlisted(product.id);
  const formattedPrice = Number(product.price).toLocaleString();
  const formattedComparePrice = product.compareAtPrice ? Number(product.compareAtPrice).toLocaleString() : null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 2500);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await buyNow(product.id, quantity);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login/user?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setReviewSubmitting(true);
    try {
      await customerApi.submitReview({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewModalOpen(false);
      // Reload product details to show new review
      const updated = await customerApi.getProductDetail(idOrSlug);
      setProduct(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.8125rem', color: '#82948a', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#526359' }}>Home</Link> /{' '}
        <Link href="/products" style={{ color: '#526359' }}>Catalog</Link> /{' '}
        <strong style={{ color: '#14291f' }}>{product.name}</strong>
      </div>

      {/* Main Product Presentation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '3rem', marginBottom: '3.5rem' }}>
        {/* Left: Image Gallery */}
        <div>
          {/* Main Large Image */}
          <div
            style={{
              width: '100%',
              paddingTop: '90%',
              position: 'relative',
              background: '#f8f5ee',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #e8e3d9',
              marginBottom: '1rem',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage || product.images[0]}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: selectedImage === img ? '#14291f' : '#e8e3d9',
                    padding: 0,
                    cursor: 'pointer',
                    background: '#f8f5ee',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Actions */}
        <div>
          {/* Seller / Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#d4a34b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              🌿 {product.seller?.storeName || 'Verified Pakistani Artisan'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#82948a' }}>SKU: {product.sku}</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f', lineHeight: 1.2, margin: '0 0 0.75rem' }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', color: '#d4a34b', fontSize: '1.1rem' }}>
              {'★'.repeat(Math.round(product.rating || 5))}
              {'☆'.repeat(5 - Math.round(product.rating || 5))}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#14291f' }}>
              {product.rating} / 5.0
            </span>
            <span style={{ color: '#82948a', fontSize: '0.8125rem' }}>
              ({product.reviewCount} customer reviews)
            </span>
          </div>

          {/* Price Box */}
          <div style={{ background: '#f8f5ee', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e8e3d9', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#14291f' }}>
                Rs. {formattedPrice}
              </span>
              {formattedComparePrice && (
                <span style={{ fontSize: '1.1rem', color: '#82948a', textDecoration: 'line-through' }}>
                  Rs. {formattedComparePrice}
                </span>
              )}
              {product.discountPercent && (
                <span style={{ background: '#d4a34b', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  Save {product.discountPercent}%
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.4rem 0 0' }}>
              Tax included. Free shipping across Pakistan on orders above Rs. 3,000.
            </p>
          </div>

          {/* Stock & Availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: product.inStock ? '#196338' : '#a82323' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: product.inStock ? '#196338' : '#a82323' }}>
              {product.inStock ? `In Stock (${product.stockQuantity} units available)` : 'Currently Out of Stock'}
            </span>
          </div>

          {/* Quantity and Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.75rem' }}>
            {/* Quantity Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #dcd5c7', borderRadius: '9999px', background: '#ffffff' }}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.55rem 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#14291f', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 700, fontSize: '0.9375rem', minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stockQuantity || 20, quantity + 1))}
                style={{ padding: '0.55rem 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#14291f', cursor: 'pointer' }}
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              style={{
                flex: 1,
                padding: '0.85rem 1.5rem',
                borderRadius: '9999px',
                fontSize: '0.9375rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isAdding ? 'Adding...' : addedMsg ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>

            {/* Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              style={{
                background: '#d4a34b',
                color: '#14291f',
                border: 'none',
                padding: '0.85rem 1.5rem',
                borderRadius: '9999px',
                fontSize: '0.9375rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ⚡ Buy Now
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1.5px solid #dcd5c7',
                background: wish ? '#fff0f0' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Wishlist"
            >
              <svg viewBox="0 0 24 24" fill={wish ? '#E05D5D' : 'none'} stroke={wish ? '#E05D5D' : '#14291f'} strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Delivery & Reassurance Box */}
          <div style={{ border: '1px solid #e8e3d9', borderRadius: '12px', padding: '1rem 1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🚚</span>
              <div style={{ fontSize: '0.8125rem' }}>
                <strong>Nationwide Courier Delivery</strong>
                <p style={{ color: '#526359', margin: 0 }}>Estimated 2-3 business days via TCS / Leopards Express.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div style={{ fontSize: '0.8125rem' }}>
                <strong>7-Day Buyer Guarantee</strong>
                <p style={{ color: '#526359', margin: 0 }}>Full refund or exchange if damaged or unsatisfied.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💵</span>
              <div style={{ fontSize: '0.8125rem' }}>
                <strong>Cash on Delivery (COD) & Raast Available</strong>
                <p style={{ color: '#526359', margin: 0 }}>Pay at your doorstep or through instant digital wallet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications Tabs */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '2rem', marginBottom: '3.5rem' }}>
        <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.6rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
          Product Details & Heritage Notes
        </h2>
        <p style={{ fontSize: '0.9375rem', color: '#526359', lineHeight: 1.7, marginBottom: '2rem' }}>
          {product.description || 'This authentic piece is handcrafted by skilled Pakistani artisans adhering to traditional heritage techniques. Every item undergoes strict quality moderation before dispatch.'}
        </p>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
          Specifications & Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {product.specifications && Object.entries(product.specifications).map(([key, val]) => (
            <div key={key} style={{ background: '#f8f5ee', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: '#526359', fontSize: '0.8125rem' }}>{key}</span>
              <span style={{ fontWeight: 700, color: '#14291f', fontSize: '0.8125rem' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '2rem', marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.6rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
              Verified Buyer Reviews ({product.reviews?.length || 0})
            </h2>
            <p style={{ color: '#526359', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              Real feedback from customers across Pakistan
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="btn-primary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: '9999px', fontSize: '0.8125rem' }}
          >
            ✍️ Write a Review
          </button>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {product.reviews.map((r) => (
              <div key={r.id} style={{ borderBottom: '1px solid #f0ebe1', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#14291f', fontSize: '0.875rem' }}>{r.customerName}</span>
                    <span style={{ background: '#e6f4ec', color: '#196338', fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                      ✓ Verified Purchase
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#82948a' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ color: '#d4a34b', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                {r.title && <p style={{ fontWeight: 700, color: '#14291f', fontSize: '0.875rem', margin: '0 0 0.25rem' }}>{r.title}</p>}
                <p style={{ color: '#526359', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#82948a', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            No reviews yet. Be the first verified customer to share your thoughts on this item!
          </p>
        )}
      </div>

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.4rem', fontWeight: 700, color: '#14291f', marginBottom: '1rem' }}>
              Review: {product.name}
            </h3>
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.4rem' }}>
                  Rating (Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{ fontSize: '1.5rem', color: star <= reviewRating ? '#d4a34b' : '#dcd5c7', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.4rem' }}>
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional quality, fast delivery!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.4rem' }}>
                  Your Review
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details of your experience with the craftsmanship and delivery..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Carousel */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.6rem', fontWeight: 700, color: '#14291f', marginBottom: '1.25rem' }}>
            You May Also Like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {product.relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
