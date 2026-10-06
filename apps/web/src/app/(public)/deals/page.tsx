'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { customerApi } from '../../../lib/customer-api';
import { ProductCard } from '../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function DealsContent(): React.ReactElement {
  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 20 });

  useEffect(() => {
    async function loadDeals() {
      try {
        const sf = await customerApi.getStorefront();
        const flash = sf.flashDeals?.products || [];
        if (flash.length > 0) {
          setProducts(flash);
        } else {
          const res = await customerApi.getProducts({ sortBy: 'price_asc', limit: 12 });
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to load deals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

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

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
      {/* Deals Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)',
          borderRadius: '20px',
          padding: '3rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 30px rgba(194, 65, 12, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span style={{ background: '#fef08a', color: '#713f12', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
            ⚡ Limited-Time Promotional Drop
          </span>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.4rem', fontWeight: 700, margin: '0.85rem 0 0.4rem' }}>
            Today's Exclusive Flash Deals
          </h1>
          <p style={{ color: '#fed7aa', fontSize: '0.9375rem', maxWidth: '520px' }}>
            Save up to 35% on verified Pakistani artisanal pottery, cold-pressed botanical serums, and premium tech.
          </p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fed7aa', margin: '0 0 0.35rem' }}>Deals Expire In</p>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
            {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
          </div>
        </div>
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
          <p style={{ color: '#526359' }}>No promotional deals active right now. Please check back soon!</p>
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

export default function DealsPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center' }}>Loading Deals...</div>}>
      <DealsContent />
    </Suspense>
  );
}
