'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CustomerStorefrontData, CustomerStorefrontProduct, CategoryItem } from '@tobetake/shared-types';
import { customerApi } from '../../lib/customer-api';
import { ProductCard } from '../../components/customer/ProductCard';

function StorefrontContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CustomerStorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'newArrivals' | 'bestSellers'>('featured');
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 20 });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Category filtering state synced with URL query (?category= or ?categorySlug=)
  const initialCategory = searchParams.get('categorySlug') || searchParams.get('category') || '';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [categoryProducts, setCategoryProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);

  // Sync state if URL searchParams change (e.g. browser back/forward)
  useEffect(() => {
    const urlCategory = searchParams.get('categorySlug') || searchParams.get('category') || '';
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams, selectedCategory]);

  // Initial load of storefront bundle
  useEffect(() => {
    async function loadStorefront() {
      try {
        const res = await customerApi.getStorefront();
        setData(res);
      } catch (err) {
        console.error('Failed to load storefront:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStorefront();
  }, []);

  // Fetch real products when a category is selected
  const fetchCategoryProducts = useCallback(async (slug: string) => {
    if (!slug) {
      setCategoryProducts([]);
      return;
    }
    setCategoryLoading(true);
    try {
      const res = await customerApi.getProducts({ categorySlug: slug, limit: 16 });
      setCategoryProducts(res.products || []);
    } catch (err) {
      console.error('Failed to filter products by category:', err);
      setCategoryProducts([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProducts(selectedCategory);
    }
  }, [selectedCategory, fetchCategoryProducts]);

  // Handler to switch category and update URL query params
  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('categorySlug', slug);
      params.delete('category');
    } else {
      params.delete('categorySlug');
      params.delete('category');
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : '/';
    router.push(newUrl, { scroll: false });
  };

  // Flash deals countdown ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const hero = data?.heroBanners?.[0];
  const allCategories: CategoryItem[] = data?.categories || [];

  // Active category display name
  const activeCategoryObj = allCategories.find((c) => c.slug === selectedCategory);
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : selectedCategory.replace(/-/g, ' ');

  // Featured spotlight item from real products for hero showcase card
  const heroSpotlightProduct = data?.featuredProducts?.[0];

  return (
    <div className="storefront-page-container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 3.5rem' }}>
      {/* 1. Large Editorial Hero Section */}
      <section className="storefront-hero-banner">
        <div className="hero-wrapper">
          <div className="hero-content-col">
            <div className="hero-pill-badge">
              <span>🌿</span>
              <span>{hero?.badge || '100% Authentic Pakistani Marketplace'}</span>
            </div>
            <h1 className="hero-headline">
              {hero?.title || 'Authentic Pakistani Artisanal & Botanical Heritage'}
            </h1>
            <p className="hero-subheadline">
              {hero?.subtitle || 'Discover authentic Multan blue pottery, cold-pressed Swat valley oils, and verified Pakistani artisanal essentials delivered securely to your doorstep.'}
            </p>
            <div className="hero-cta-group">
              <Link href="/products" className="btn-hero-primary">
                <span>Explore Catalog</span>
                <span>→</span>
              </Link>
              <button
                type="button"
                onClick={() => handleSelectCategory('botanical-skincare')}
                className="btn-hero-secondary"
              >
                <span>🌿</span>
                <span>Shop Swat Botanicals</span>
              </button>
            </div>
            <div className="hero-trust-mini">
              <span>✓ Verified Artisans</span>
              <span>•</span>
              <span>✓ Cash on Delivery (COD)</span>
              <span>•</span>
              <span>✓ Doorstep TCS Shipping</span>
            </div>
          </div>

          {/* Hero Right Showcase Feature Card (Desktop) */}
          <div className="hero-feature-col">
            <div className="feature-glass-box">
              <div className="feature-header-row">
                <span className="feature-tag-pill">✨ Featured Botanical</span>
                <span className="feature-rating-pill">★ 4.9 (48)</span>
              </div>
              <div className="feature-card-content">
                <div className="feature-img-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroSpotlightProduct?.images?.[0] || 'https://images.unsplash.com/photo-1608248597359-00984852086e?auto=format&fit=crop&q=80&w=400'}
                    alt="Spotlight Botanical"
                    className="feature-img"
                  />
                </div>
                <div className="feature-text-box">
                  <h4>{heroSpotlightProduct?.name || 'Swat Rosehip Facial Oil'}</h4>
                  <p>Pure cold-pressed organic serum</p>
                  <span className="feature-price-tag">
                    Rs. {Number(heroSpotlightProduct?.price || 2450).toLocaleString()}
                  </span>
                </div>
              </div>
              <Link
                href={heroSpotlightProduct ? `/products/${heroSpotlightProduct.slug || heroSpotlightProduct.id}` : '/products'}
                className="feature-action-btn"
              >
                View Spotlight Item →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges Strip (Customer Confidence Cues) */}
      <section className="storefront-trust-strip" aria-label="Why Shop With ToBeTake">
        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-card-icon">🌿</div>
            <div className="trust-card-info">
              <h4>100% Authentic Heritage</h4>
              <p>Direct from certified Multan & Swat makers</p>
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-card-icon">🚚</div>
            <div className="trust-card-info">
              <h4>Fast TCS & Leopard Shipping</h4>
              <p>Reliable 2-4 day doorstep delivery in Pakistan</p>
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-card-icon">💳</div>
            <div className="trust-card-info">
              <h4>COD & Mobile Wallets</h4>
              <p>Cash on Delivery, JazzCash, EasyPaisa & Raast</p>
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-card-info">🛡️</div>
            <div className="trust-card-info">
              <h4>7-Day Buyer Protection</h4>
              <p>Hassle-free returns & quality guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop by Curated Category */}
      <section className="category-pills-section" id="curated-categories">
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">Shop by Curated Category</h2>
            <p className="section-subtitle">Discover handcrafted heritage pottery, natural botanicals, and lifestyle essentials</p>
          </div>
          <Link href="/products" className="section-view-all">
            <span>View All in Catalog</span>
            <span>→</span>
          </Link>
        </div>

        <div className="category-cards-grid">
          <button
            type="button"
            onClick={() => handleSelectCategory('ceramics-tableware')}
            className={`category-pill-card ${selectedCategory === 'ceramics-tableware' ? 'active-pill' : ''}`}
          >
            <div className="category-card-icon">🏺</div>
            <span className="category-card-name">Multan Pottery</span>
            <span className="category-card-count">Blue Pottery & Cups</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('botanical-skincare')}
            className={`category-pill-card ${selectedCategory === 'botanical-skincare' ? 'active-pill' : ''}`}
          >
            <div className="category-card-icon">🍃</div>
            <span className="category-card-name">Swat Botanicals</span>
            <span className="category-card-count">Rosehip & Skincare</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('aromatherapy-oils')}
            className={`category-pill-card ${selectedCategory === 'aromatherapy-oils' ? 'active-pill' : ''}`}
          >
            <div className="category-card-icon">💧</div>
            <span className="category-card-name">Essential Oils</span>
            <span className="category-card-count">Lavender & Herbal</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('electronics-gadgets')}
            className={`category-pill-card ${selectedCategory === 'electronics-gadgets' ? 'active-pill' : ''}`}
          >
            <div className="category-card-icon">🎧</div>
            <span className="category-card-name">Smart Tech</span>
            <span className="category-card-count">ANC Earbuds & Audio</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('home-living')}
            className={`category-pill-card ${selectedCategory === 'home-living' ? 'active-pill' : ''}`}
          >
            <div className="category-card-icon">🏡</div>
            <span className="category-card-name">Home & Living</span>
            <span className="category-card-count">Chiniot & Lahore Decor</span>
          </button>

          <Link href="/products?sortBy=price_asc" className="category-pill-card" style={{ borderColor: '#fed7aa', background: '#fffaf2' }}>
            <div className="category-card-icon" style={{ background: '#ffedd5' }}>⚡</div>
            <span className="category-card-name" style={{ color: '#c94a29' }}>Flash Deals</span>
            <span className="category-card-count">Up to 35% Off</span>
          </Link>
        </div>
      </section>

      {/* 4. Limited-Time Flash Deals */}
      <section className="flash-deals-box">
        <div className="flash-deals-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <h2 className="section-main-title" style={{ fontSize: '1.55rem', margin: 0 }}>
                Today's Flash Deals
              </h2>
            </div>
            <p className="section-subtitle">Special promotional discounts on Pakistani artisan crafts and skincare</p>
          </div>

          <div className="flash-timer-wrap">
            <span>Ends In:</span>
            <span>
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>

        <div className="products-slider-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            ))
          ) : (
            (data?.flashDeals?.products || data?.featuredProducts?.slice(0, 4) || []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </section>

      {/* 5. Editorial Split Promo Section */}
      <section className="editorial-split-section">
        <div className="editorial-img-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800"
            alt="Artisanal Lifestyle"
            className="editorial-img"
          />
        </div>
        <div className="editorial-content-col">
          <span className="editorial-tag">Artisan Craft & Purity</span>
          <h2 className="editorial-title">Curated for your everyday living.</h2>
          <p className="editorial-desc">
            From the hand-painted pottery kilns of Multan to the mountain-harvested botanicals of Swat, ToBeTake brings you timeless craftsmanship paired with modern convenience.
          </p>
          <div>
            <Link href="/products" className="btn-hero-primary" style={{ padding: '0.85rem 1.75rem' }}>
              Explore Curated Drops →
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Interactive Marketplace Catalog with Live Category Filter & Tabs */}
      <section style={{ marginBottom: '3.5rem' }} id="catalog-showcase">
        <div className="section-header-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="section-main-title">
              {selectedCategory ? `Category: ${activeCategoryName}` : 'Curated Marketplace Catalog'}
            </h2>
            <p className="section-subtitle">
              {selectedCategory
                ? `Showing authentic items filtered by ${activeCategoryName}`
                : 'Verified items in stock with PKR pricing and doorstep delivery'}
            </p>
          </div>

          {/* If no category is selected, show Tab switches */}
          {!selectedCategory ? (
            <div style={{ display: 'flex', background: '#ebe5da', borderRadius: '9999px', padding: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('featured')}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  background: activeTab === 'featured' ? '#14291f' : 'transparent',
                  color: activeTab === 'featured' ? '#ffffff' : '#526359',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('newArrivals')}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  background: activeTab === 'newArrivals' ? '#14291f' : 'transparent',
                  color: activeTab === 'newArrivals' ? '#ffffff' : '#526359',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                New Arrivals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bestSellers')}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  background: activeTab === 'bestSellers' ? '#14291f' : 'transparent',
                  color: activeTab === 'bestSellers' ? '#ffffff' : '#526359',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Best Sellers
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14291f' }}>
                {categoryLoading ? 'Filtering items...' : `${categoryProducts.length} items found`}
              </span>
              <button
                type="button"
                onClick={() => handleSelectCategory('')}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  background: '#14291f',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(20, 41, 31, 0.2)',
                }}
              >
                ✕ Clear Category
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Category Chips Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            overflowX: 'auto',
            padding: '0.5rem 0 1.25rem',
            marginBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectCategory('')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1.5px solid',
              borderColor: selectedCategory === '' ? '#14291f' : '#dcd5c7',
              background: selectedCategory === '' ? '#14291f' : '#ffffff',
              color: selectedCategory === '' ? '#ffffff' : '#14291f',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: selectedCategory === '' ? '0 2px 8px rgba(20, 41, 31, 0.2)' : 'none',
            }}
          >
            ✨ All Products
          </button>

          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.slug)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: '1.5px solid',
                  borderColor: isSelected ? '#14291f' : '#dcd5c7',
                  background: isSelected ? '#14291f' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#14291f',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(20, 41, 31, 0.2)' : 'none',
                }}
              >
                {cat.name} {cat.productCount !== undefined && `(${cat.productCount})`}
              </button>
            );
          })}
        </div>

        {/* Dynamic Products Grid or Loading / Empty State */}
        {selectedCategory ? (
          categoryLoading ? (
            <div className="products-marketplace-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : categoryProducts.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e8e3d9',
                borderRadius: '20px',
                padding: '4rem 2rem',
                textAlign: 'center',
                margin: '1.5rem 0',
                boxShadow: '0 4px 18px rgba(20, 41, 31, 0.04)',
              }}
            >
              <span style={{ fontSize: '3.5rem' }}>🌿</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
                No products found in {activeCategoryName}
              </h3>
              <p style={{ color: '#526359', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
                We could not find any active products in this category right now. You can explore all items or select another category.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory('')}
                className="btn-primary"
                style={{ padding: '0.75rem 1.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700 }}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="products-marketplace-grid">
              {categoryProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : (
          <div className="products-marketplace-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : (
              (activeTab === 'featured'
                ? data?.featuredProducts
                : activeTab === 'newArrivals'
                ? data?.newArrivals
                : data?.bestSellers
              )?.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        )}
      </section>

      {/* 7. Master Artisan & Certified Seller Spotlight */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">Certified Master Artisans & Verified Merchants</h2>
            <p className="section-subtitle">Directly supporting authentic heritage craftspeople across Pakistan</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {data?.sellerSpotlights?.map((seller) => (
            <div
              key={seller.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e8e3d9',
                borderRadius: '18px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 18px rgba(20, 41, 31, 0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', marginBottom: '1.1rem' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#14291f',
                      color: '#d4a34b',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(20, 41, 31, 0.15)',
                    }}
                  >
                    {seller.storeName[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
                      {seller.storeName}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#526359', margin: '0.2rem 0 0' }}>
                      📍 {seller.city} • <span style={{ color: '#196338', fontWeight: 700 }}>✓ Verified Artisan</span>
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: '#526359', lineHeight: 1.55, marginBottom: '1.35rem' }}>
                  Specializes in {seller.businessCategory}. High standard quality crafted with genuine Pakistani raw materials.
                </p>
              </div>

              <div style={{ borderTop: '1px dashed #e8e3d9', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14291f' }}>
                  {seller.productCount} Handcrafted Items
                </span>
                <Link
                  href={`/products?sellerId=${seller.id}`}
                  style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#d4a34b', textDecoration: 'none' }}
                >
                  Visit Store →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Customer Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-main-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real experiences from discerning shoppers across Pakistan</p>
          </div>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "The Multan pottery vases arrived in Lahore within 2 days via TCS. Packing was extraordinarily secure and the glazing quality exceeded my expectations."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">Z</div>
              <div>
                <p className="author-name">Zainab Tariq</p>
                <p className="author-city">Lahore, Punjab</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "Swat Rosehip oil is 100% pure cold-pressed. Truly happy to see authentic local natural skincare delivered with seamless Raast payment."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">B</div>
              <div>
                <p className="author-name">Bilal Ahmed</p>
                <p className="author-city">Islamabad, ICT</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "Ordered ANC earbuds with COD in Karachi. Smooth delivery and crisp sound quality. ToBeTake is now my go-to marketplace."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">A</div>
              <div>
                <p className="author-name">Ayesha Khan</p>
                <p className="author-city">Karachi, Sindh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pure Swat Botanical Promotional Banner */}
      <section
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(212, 163, 75, 0.2) 0%, transparent 45%), linear-gradient(135deg, #1f4a37 0%, #14291f 100%)',
          borderRadius: '20px',
          padding: '2.75rem 2.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.75rem',
          marginBottom: '3.5rem',
          boxShadow: '0 12px 32px rgba(20, 41, 31, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '620px' }}>
          <span style={{ background: '#d4a34b', color: '#14291f', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', border: 'none', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Exclusive Botanical Promo
          </span>
          <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.1rem', fontWeight: 700, margin: '0.95rem 0 0.6rem', color: '#ffffff' }}>
            Save 15% on Swat Valley Rosehip & Pure Lavender
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#c1d1c7', lineHeight: 1.55 }}>
            Use voucher code <strong style={{ color: '#ffffff', background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '0.05em' }}>PAKISTAN15</strong> at checkout for instant 15% discount on all botanical items.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => handleSelectCategory('botanical-skincare')}
            style={{
              background: '#ffffff',
              color: '#14291f',
              fontWeight: 800,
              fontSize: '0.875rem',
              padding: '0.9rem 1.85rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.15s, background 0.15s',
            }}
          >
            <span>🌿</span>
            <span>Claim 15% Off Now</span>
          </button>
        </div>
      </section>

      {/* 10. Newsletter & Early Access CTA */}
      <section className="newsletter-box">
        <h3>Get first access to new drops & exclusive offers</h3>
        <p>Subscribe to receive special artisan showcase announcements and exclusive seasonal vouchers.</p>
        {newsletterSubscribed ? (
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem 1.5rem', borderRadius: '9999px', display: 'inline-block', fontWeight: 700, color: '#d4a34b' }}>
            ✓ Thank you for subscribing to ToBeTake updates!
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email address..."
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-btn">
              Subscribe Now
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default function StorefrontHomePage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#14291f', fontWeight: 600 }}>Loading Storefront...</div>}>
      <StorefrontContent />
    </Suspense>
  );
}
