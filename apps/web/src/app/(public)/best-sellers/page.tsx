'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { customerApi } from '../../../lib/customer-api';
import { ProductCard } from '../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function BestSellersContent(): React.ReactElement {
  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBestSellers() {
      try {
        const sf = await customerApi.getStorefront();
        if (sf.bestSellers && sf.bestSellers.length > 0) {
          setProducts(sf.bestSellers);
        } else {
          const res = await customerApi.getProducts({ sortBy: 'popularity', limit: 12 });
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to load best sellers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBestSellers();
  }, []);

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Banner */}
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
          ⭐ Customer Favorites
        </span>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.4rem', fontWeight: 700, margin: '0.75rem 0 0.4rem' }}>
          Best Sellers
        </h1>
        <p style={{ color: '#d1ded6', fontSize: '0.9375rem', maxWidth: '540px' }}>
          The highest-rated Multan ceramics, most-loved Swat botanicals, and top customer picks across Pakistan.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="products-marketplace-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e8e3d9' }}>
          <p style={{ color: '#526359' }}>No best sellers found.</p>
          <Link href="/shop" className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px', display: 'inline-block', marginTop: '1rem' }}>
            Explore All Catalog
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

export default function BestSellersPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center' }}>Loading Best Sellers...</div>}>
      <BestSellersContent />
    </Suspense>
  );
}
