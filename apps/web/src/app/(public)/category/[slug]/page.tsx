'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '../../../../lib/customer-api';
import { ProductCard } from '../../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function CategoryDetailContent(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || '';

  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const fetchCategoryProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getProducts({
        categorySlug: slug,
        sortBy: sortBy as any,
        limit: 16,
      });
      setProducts(res.products || []);
      if (res.availableCategories) {
        setCategories(res.availableCategories);
      }
    } catch (err) {
      console.error('Failed to load category products:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, sortBy]);

  useEffect(() => {
    fetchCategoryProducts();
  }, [fetchCategoryProducts]);

  const activeCategoryObj = categories.find((c) => c.slug === slug);
  const categoryTitle = activeCategoryObj ? activeCategoryObj.name : slug.replace(/-/g, ' ');

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#82948a', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#526359', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link href="/shop" style={{ color: '#526359', textDecoration: 'none' }}>Categories</Link>
        <span>/</span>
        <span style={{ color: '#14291f', fontWeight: 600, textTransform: 'capitalize' }}>{categoryTitle}</span>
      </nav>

      {/* Category Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14291f 0%, #1e4533 100%)',
          borderRadius: '20px',
          padding: '2.75rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 28px rgba(20, 41, 31, 0.1)',
        }}
      >
        <span style={{ background: '#d4a34b', color: '#14291f', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
          Verified Artisan Collection
        </span>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.4rem', fontWeight: 700, margin: '0.75rem 0 0.4rem', textTransform: 'capitalize' }}>
          {categoryTitle}
        </h1>
        <p style={{ color: '#d1ded6', fontSize: '0.9375rem', maxWidth: '540px' }}>
          Authentic handcrafted items and botanical extracts sourced directly from verified regional craftspeople across Pakistan.
        </p>
      </div>

      {/* Toolbar & Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#14291f', margin: 0 }}>
          {products.length} Products Found
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              border: '1px solid #dcd5c7',
              background: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#14291f',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Grid or Empty */}
      {loading ? (
        <div className="products-marketplace-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 18px rgba(20, 41, 31, 0.04)' }}>
          <span style={{ fontSize: '3.5rem' }}>🌿</span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
            No Products Found in {categoryTitle}
          </h3>
          <p style={{ color: '#526359', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Check back soon as new artisanal batches arrive daily or browse our full collection.
          </p>
          <Link href="/shop" className="btn-primary" style={{ padding: '0.65rem 1.75rem', borderRadius: '9999px', textDecoration: 'none', display: 'inline-block' }}>
            Explore All Products
          </Link>
        </div>
      ) : (
        <div className="products-marketplace-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryDetailPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#14291f', fontWeight: 600 }}>Loading Category...</div>}>
      <CategoryDetailContent />
    </Suspense>
  );
}
