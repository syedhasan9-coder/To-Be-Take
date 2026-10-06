'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CategoryItem } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';

export default function AddSellerProductPage(): React.ReactElement {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    categoryId: '',
    stockQuantity: '10',
    lowStockThreshold: '5',
    location: 'Main Warehouse',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await sellerFetch('/api/seller/products/categories');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCategories(json.data);
          }
        }
      } catch {
        // Suppress
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : undefined,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5,
        location: formData.location.trim() || undefined,
      };

      if (!payload.name || !payload.sku || isNaN(payload.price) || payload.price <= 0) {
        throw new Error('Please fill in all required fields with valid values.');
      }

      const res = await sellerFetch('/api/seller/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create product.');
      }

      router.push('/seller/products');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '840px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/seller/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-forest-700, #2d6a4f)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Back to Product Catalog
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #e2d9cc', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
            Add New Store Product
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            List a new product in your marketplace storefront with inventory allocation.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Product Name & SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Organic Matcha Green Tea"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Stock Keeping Unit (SKU) *
              </label>
              <input
                type="text"
                name="sku"
                required
                placeholder="e.g. MATCHA-001"
                value={formData.sku}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Category & Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff' }}
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Selling Price (PKR / Rs) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="price"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Compare-at Price (PKR / Rs)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="compareAtPrice"
                placeholder="Optional original price"
                value={formData.compareAtPrice}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Inventory & Warehouse Location */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#faf8f5', padding: '1rem', borderRadius: '8px', border: '1px solid #e2d9cc' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Warehouse Location
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Shelf B2, Bin 4"
                value={formData.location}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
              Product Description
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Highlight product ingredients, botanical attributes, sizing, or usage details..."
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link
              href="/seller/products"
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', textDecoration: 'none' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-seller"
              style={{ padding: '0.6rem 1.75rem' }}
            >
              {isSubmitting ? 'Publishing Product...' : 'Publish Product to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
