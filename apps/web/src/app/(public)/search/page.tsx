'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '../../../lib/customer-api';
import { ProductCard } from '../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function SearchResultsContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('search') || '';

  const [inputQuery, setInputQuery] = useState(query);
  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await customerApi.getProducts({
        search: q || undefined,
        limit: 16,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputQuery(query);
    fetchSearchResults(query);
  }, [query, fetchSearchResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Search Header */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '2.5rem', textAlign: 'center', boxShadow: '0 4px 18px rgba(20, 41, 31, 0.04)' }}>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.5rem' }}>
          {query ? `Search Results for "${query}"` : 'Search ToBeTake Marketplace'}
        </h1>
        <p style={{ color: '#526359', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
          Explore authentic ceramics, botanical skincare, pure oils, and lifestyle tech
        </p>

        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search pottery, rosehip oil, earbuds..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '0.8rem 1.25rem',
              borderRadius: '9999px',
              border: '1.5px solid #dcd5c7',
              fontSize: '0.9375rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.8rem 1.75rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}
          >
            Search
          </button>
        </form>

        {/* Quick Tag Suggestions */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#82948a' }}>Popular:</span>
          {['Multan Vase', 'Rosehip Oil', 'Lavender', 'Earbuds', 'Tableware'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setInputQuery(tag);
                router.push(`/search?q=${encodeURIComponent(tag)}`);
              }}
              style={{
                background: '#f8f5ee',
                border: '1px solid #e8e3d9',
                borderRadius: '9999px',
                padding: '0.2rem 0.65rem',
                fontSize: '0.75rem',
                color: '#14291f',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          {loading ? 'Searching...' : `${products.length} Items Found`}
        </p>
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
          <span style={{ fontSize: '3.5rem' }}>🔍</span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
            Nothing matched your search for "{query}"
          </h3>
          <p style={{ color: '#526359', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Please check your spelling, try more general terms, or explore our curated categories.
          </p>
          <Link href="/shop" className="btn-primary" style={{ padding: '0.65rem 1.75rem', borderRadius: '9999px', textDecoration: 'none', display: 'inline-block' }}>
            Browse All Marketplace Products
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

export default function SearchPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#14291f', fontWeight: 600 }}>Loading Search...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
