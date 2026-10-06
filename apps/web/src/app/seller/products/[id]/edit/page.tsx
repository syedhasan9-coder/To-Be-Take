'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { CategoryItem, ProductListItem } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';

export default function EditSellerProductPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
    status: 'ACTIVE',
  });

  const fetchProductAndCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        sellerFetch(`/api/seller/products/${productId}`),
        sellerFetch('/api/seller/products/categories'),
      ]);

      if (!prodRes.ok) {
        throw new Error(`Product not found or not in your store.`);
      }

      const prodJson = await prodRes.json();
      if (prodJson.success && prodJson.data) {
        const p: ProductListItem = prodJson.data;
        setFormData({
          name: p.name,
          sku: p.sku,
          description: p.description || '',
          price: p.price.toString(),
          compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : '',
          costPrice: p.costPrice ? p.costPrice.toString() : '',
          categoryId: p.categoryId ? p.categoryId.toString() : '',
          status: p.status,
        });
      }

      if (catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.success && catJson.data) {
          setCategories(catJson.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProductAndCategories();
    }
  }, [productId, fetchProductAndCategories]);

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
        status: formData.status as any,
      };

      if (!payload.name || !payload.sku || isNaN(payload.price) || payload.price <= 0) {
        throw new Error('Please fill in all required fields with valid values.');
      }

      const res = await sellerFetch(`/api/seller/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update product.');
      }

      router.push('/seller/products');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while updating product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading product details...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '840px', margin: '0 auto' }}>
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
            Edit Catalog Product
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Update product title, SKU, pricing, category, and catalog status.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', textTransform: 'uppercase' }}
              />
            </div>
          </div>

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
                Price (PKR / Rs) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
                Catalog Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff' }}
              >
                <option value="ACTIVE">Active (Live in Store)</option>
                <option value="INACTIVE">Inactive (Hidden)</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1b4332' }}>
              Product Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

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
              {isSubmitting ? 'Saving Changes...' : 'Save Product Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
