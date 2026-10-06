'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { customerApi } from '../../../lib/customer-api';
import { ProductCard } from '../../../components/customer/ProductCard';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';

function ProductsCatalogContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters state initialized from URL search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('categorySlug') || searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Sync state when searchParams change (browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('categorySlug') || searchParams.get('category') || '';
    const urlMinPrice = searchParams.get('minPrice') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';
    const urlSortBy = searchParams.get('sortBy') || 'newest';
    const urlInStock = searchParams.get('inStock') === 'true';
    const urlPage = Number(searchParams.get('page')) || 1;

    setSearch(urlSearch);
    setCategorySlug(urlCategory);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setSortBy(urlSortBy);
    setInStockOnly(urlInStock);
    setPage(urlPage);
  }, [searchParams]);

  // Push updated filter state to URL
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
    const newUrl = queryString ? `/products?${queryString}` : '/products';
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

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    syncFiltersToUrl({ page: 1 });
  };

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    setPage(1);
    syncFiltersToUrl({ categorySlug: slug, page: 1 });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategorySlug('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setInStockOnly(false);
    setPage(1);
    router.push('/products');
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
      {/* Breadcrumbs & Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8125rem', color: '#82948a', marginBottom: '0.4rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span> / <strong>Catalog</strong>
        </div>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '2.2rem', fontWeight: 700, color: '#14291f' }}>
          Explore Pakistani Marketplace
        </h1>
        <p style={{ color: '#526359', fontSize: '0.875rem' }}>
          Handcrafted Multan pottery, Swat botanicals, lifestyle goods & tech with nationwide delivery.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid #e8e3d9',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'sticky',
            top: '120px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
              Filters
            </h3>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4a34b', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleApplyFilters}>
            {/* Search within catalog */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.4rem' }}>
                Keyword Search
              </label>
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '8px',
                  border: '1px solid #dcd5c7',
                  background: '#f8f5ee',
                  outline: 'none',
                }}
              />
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '1.25rem', borderTop: '1px solid #f0ebe1', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.6rem' }}>
                Categories
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '220px', overflowY: 'auto' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#526359', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="category"
                    checked={categorySlug === ''}
                    onChange={() => handleCategoryChange('')}
                  />
                  <span style={categorySlug === '' ? { fontWeight: 700, color: '#14291f' } : {}}>All Categories</span>
                </label>
                {categories.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#526359', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="category"
                      checked={categorySlug === c.slug}
                      onChange={() => handleCategoryChange(c.slug)}
                    />
                    <span style={categorySlug === c.slug ? { fontWeight: 700, color: '#14291f' } : {}}>
                      {c.name} {c.count !== undefined && `(${c.count})`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter (PKR) */}
            <div style={{ marginBottom: '1.25rem', borderTop: '1px solid #f0ebe1', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.6rem' }}>
                Price Range (PKR / Rs)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{
                    width: '50%',
                    padding: '0.5rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid #dcd5c7',
                    background: '#f8f5ee',
                  }}
                />
                <span style={{ color: '#82948a' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    width: '50%',
                    padding: '0.5rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    border: '1px solid #dcd5c7',
                    background: '#f8f5ee',
                  }}
                />
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #f0ebe1', paddingTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: '#14291f', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                    syncFiltersToUrl({ inStockOnly: e.target.checked, page: 1 });
                  }}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8125rem' }}
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Products Main View */}
        <main>
          {/* Top Sort & Count Bar */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e8e3d9',
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#526359', fontWeight: 600 }}>
              Showing <strong>{products.length}</strong> of <strong>{pagination.total}</strong> products
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', color: '#526359', fontWeight: 600 }}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                  syncFiltersToUrl({ sortBy: e.target.value, page: 1 });
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #dcd5c7',
                  background: '#f8f5ee',
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
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} style={{ height: '360px', background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '14px' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e8e3d9',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#14291f', margin: '1rem 0 0.5rem' }}>
                No matching products found
              </h3>
              <p style={{ color: '#526359', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                We couldn't find any products matching your active category or filter settings. Try clearing your search keyword or selecting All Categories.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-primary"
                style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  syncFiltersToUrl({ page: newPage });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #dcd5c7',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newPage = idx + 1;
                    setPage(newPage);
                    syncFiltersToUrl({ page: newPage });
                  }}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: page === idx + 1 ? '#14291f' : '#dcd5c7',
                    background: page === idx + 1 ? '#14291f' : '#ffffff',
                    color: page === idx + 1 ? '#ffffff' : '#14291f',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  syncFiltersToUrl({ page: newPage });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #dcd5c7',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= pagination.totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsCatalogPage(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Loading Catalog...</div>}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
