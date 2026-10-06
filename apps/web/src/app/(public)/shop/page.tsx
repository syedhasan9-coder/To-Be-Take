'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '../../../lib/customer-api';
import { ProductCard } from '../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function ShopCatalogContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; productCount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('categorySlug') || searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Sync state if URL searchParams change
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategorySlug(searchParams.get('categorySlug') || searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sortBy') || 'newest');
    setInStockOnly(searchParams.get('inStock') === 'true');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  const syncFiltersToUrl = useCallback((updates: {
    search?: string;
    categorySlug?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    inStockOnly?: boolean;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const currentSearch = updates.search !== undefined ? updates.search : search;
    const currentCategory = updates.categorySlug !== undefined ? updates.categorySlug : categorySlug;
    const currentMin = updates.minPrice !== undefined ? updates.minPrice : minPrice;
    const currentMax = updates.maxPrice !== undefined ? updates.maxPrice : maxPrice;
    const currentSort = updates.sortBy !== undefined ? updates.sortBy : sortBy;
    const currentStock = updates.inStockOnly !== undefined ? updates.inStockOnly : inStockOnly;
    const currentPage = updates.page !== undefined ? updates.page : page;

    if (currentSearch) params.set('search', currentSearch);
    if (currentCategory) params.set('categorySlug', currentCategory);
    if (currentMin) params.set('minPrice', currentMin);
    if (currentMax) params.set('maxPrice', currentMax);
    if (currentSort && currentSort !== 'newest') params.set('sortBy', currentSort);
    if (currentStock) params.set('inStock', 'true');
    if (currentPage > 1) params.set('page', String(currentPage));

    const queryString = params.toString();
    const newUrl = queryString ? `/shop?${queryString}` : '/shop';
    router.push(newUrl, { scroll: false });
  }, [search, categorySlug, minPrice, maxPrice, sortBy, inStockOnly, page, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getProducts({
        page,
        limit: 12,
        search: search || undefined,
        categorySlug: categorySlug || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy as any,
        inStock: inStockOnly || undefined,
      });

      setProducts(res.products || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      if (res.availableCategories && res.availableCategories.length > 0) {
        setCategories(res.availableCategories);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categorySlug, minPrice, maxPrice, sortBy, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers
  const handleCategoryClick = (slug: string) => {
    const nextSlug = categorySlug === slug ? '' : slug;
    setCategorySlug(nextSlug);
    setPage(1);
    syncFiltersToUrl({ categorySlug: nextSlug, page: 1 });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    syncFiltersToUrl({ minPrice, maxPrice, page: 1 });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategorySlug('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setInStockOnly(false);
    setPage(1);
    router.push('/shop');
  };

  const activeCategoryObj = categories.find((c) => c.slug === categorySlug);
  const activeCategoryTitle = activeCategoryObj ? activeCategoryObj.name : (categorySlug ? categorySlug.replace(/-/g, ' ') : 'All Products');

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 3.5rem' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#82948a', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: '#526359', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <span style={{ color: '#14291f', fontWeight: 600 }}>{activeCategoryTitle}</span>
      </nav>

      {/* Hero Header */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '18px', padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 16px rgba(20, 41, 31, 0.03)' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
            {activeCategoryTitle}
          </h1>
          <p style={{ color: '#526359', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
            Showing {pagination.total} verified authentic Pakistani products with nationwide doorstep delivery
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#526359' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              syncFiltersToUrl({ sortBy: e.target.value, page: 1 });
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1.5px solid #dcd5c7',
              background: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#14291f',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">✨ Newest Arrivals</option>
            <option value="price_asc">💵 Price: Low to High</option>
            <option value="price_desc">💎 Price: High to Low</option>
            <option value="rating">⭐ Highest Rated</option>
            <option value="popularity">🔥 Best Sellers</option>
          </select>
        </div>
      </div>

      {/* Main PLP Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '2rem' }}>
        {/* Sidebar Filter Panel */}
        <aside style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '18px', padding: '1.5rem', height: 'fit-content', boxShadow: '0 4px 16px rgba(20, 41, 31, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0ebe1' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14291f', margin: 0 }}>Filters</h3>
            {(categorySlug || search || minPrice || maxPrice || inStockOnly) && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{ background: 'none', border: 'none', color: '#c94a29', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#14291f', marginBottom: '0.65rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => handleCategoryClick('')}
                style={{
                  textAlign: 'left',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: categorySlug === '' ? 700 : 500,
                  background: categorySlug === '' ? '#f4eee2' : 'transparent',
                  color: categorySlug === '' ? '#14291f' : '#526359',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                ✨ All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: categorySlug === cat.slug ? 700 : 500,
                    background: categorySlug === cat.slug ? '#f4eee2' : 'transparent',
                    color: categorySlug === cat.slug ? '#14291f' : '#526359',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{cat.name}</span>
                  {cat.productCount !== undefined && <span style={{ fontSize: '0.75rem', color: '#82948a' }}>({cat.productCount})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #f0ebe1', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#14291f', marginBottom: '0.65rem' }}>Price (PKR)</h4>
            <form onSubmit={handlePriceApply} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #dcd5c7', borderRadius: '8px', fontSize: '0.8125rem', outline: 'none' }}
                />
                <span style={{ color: '#82948a' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #dcd5c7', borderRadius: '8px', fontSize: '0.8125rem', outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#14291f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '0.25rem',
                }}
              >
                Apply Price
              </button>
            </form>
          </div>

          {/* Availability Toggle */}
          <div style={{ borderTop: '1px solid #f0ebe1', paddingTop: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#14291f' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  syncFiltersToUrl({ inStockOnly: e.target.checked, page: 1 });
                }}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products Grid / Results */}
        <main>
          {loading ? (
            <div className="products-marketplace-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} style={{ height: '360px', background: '#f0ebe1', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 18px rgba(20, 41, 31, 0.04)' }}>
              <span style={{ fontSize: '3.5rem' }}>🌿</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
                No Products Match Your Filter
              </h3>
              <p style={{ color: '#526359', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Try adjusting your price range, changing category, or resetting all active filters.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-primary"
                style={{ padding: '0.65rem 1.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700 }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="products-marketplace-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage(page - 1);
                      syncFiltersToUrl({ page: page - 1 });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #dcd5c7',
                      background: page <= 1 ? '#f5f2eb' : '#ffffff',
                      color: page <= 1 ? '#82948a' : '#14291f',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                    }}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    const isActive = pNum === page;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => {
                          setPage(pNum);
                          syncFiltersToUrl({ page: pNum });
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isActive ? '#14291f' : '#dcd5c7',
                          background: isActive ? '#14291f' : '#ffffff',
                          color: isActive ? '#ffffff' : '#14291f',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => {
                      setPage(page + 1);
                      syncFiltersToUrl({ page: page + 1 });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #dcd5c7',
                      background: page >= pagination.totalPages ? '#f5f2eb' : '#ffffff',
                      color: page >= pagination.totalPages ? '#82948a' : '#14291f',
                      cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ShopPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#14291f', fontWeight: 600 }}>Loading Catalog...</div>}>
      <ShopCatalogContent />
    </Suspense>
  );
}
