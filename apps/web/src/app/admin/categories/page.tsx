'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCategoryItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminModal } from '@/components/admin/AdminModal';
import { adminFetch } from '@/lib/api';

export default function AdminCategoriesPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AdminCategoryItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');

      const res = await adminFetch(`/api/admin/categories?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data)) {
          setData({
            items: json.data,
            total: json.data.length,
            page: 1,
            limit: json.data.length,
            totalPages: 1,
          });
        } else {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      showToast('error', 'Failed to load categories list.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormParentId('');
    setFormIsActive(true);
  };

  const handleOpenEditModal = (cat: AdminCategoryItem) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormParentId(cat.parentId ? String(cat.parentId) : '');
    setFormIsActive(cat.isActive);
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      showToast('error', 'Category name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim() || undefined,
        parentId: formParentId || undefined,
        isActive: formIsActive,
      };

      let res: Response;
      if (modalMode === 'create') {
        res = await adminFetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch(`/api/admin/categories/${editingCategory?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Operation failed');
      showToast(
        'success',
        modalMode === 'create'
          ? `Category '${formName}' created successfully.`
          : `Category '${formName}' updated.`,
      );
      setModalMode(null);
      fetchCategories();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategoryItem) => {
    try {
      const res = await adminFetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to toggle status');
      showToast('success', `Category is now ${!cat.isActive ? 'Active' : 'Inactive'}`);
      fetchCategories();
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  return (
    <div>
      <AdminToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Welcome Banner */}
      <div className="admin-welcome-banner">
        <div className="admin-welcome-inner">
          <div className="admin-welcome-tag">Marketplace Taxonomy</div>
          <h1 className="admin-welcome-title">Category Architecture</h1>
          <p className="admin-welcome-desc">
            Define department hierarchies, sub-categories, search discoverability, and product
            grouping for the marketplace catalog.
          </p>
          <div className="admin-welcome-actions">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="admin-banner-action-btn primary"
            >
              + Create New Category
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name, slug..."
            className="admin-search-input"
            style={{ maxWidth: '340px' }}
          />

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="admin-banner-action-btn primary"
            style={{ padding: '0.45rem 1rem' }}
          >
            + Add Category
          </button>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Parent Category</th>
                <th>Products Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Loading categories...</div>
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>No categories found.</div>
                  </td>
                </tr>
              ) : (
                data.items.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        {cat.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {cat.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '0.8rem',
                          background: 'var(--bg-cream)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        {cat.slug}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {cat.parentName || '— (Top Level)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{(cat as any).productCount ?? cat.productsCount ?? 0}</span> products
                    </td>
                    <td>
                      <AdminBadge status={cat.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="admin-banner-action-btn"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-forest-800)',
                            background: 'var(--bg-cream)',
                            borderColor: 'var(--border-medium)',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.75rem',
                            background: cat.isActive ? 'var(--bg-cream)' : 'var(--success-bg)',
                            color: cat.isActive ? 'var(--text-secondary)' : 'var(--success-text)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <AdminModal
          isOpen={true}
          title={
            modalMode === 'create'
              ? 'Create New Category'
              : `Edit Category: ${editingCategory?.name}`
          }
          onClose={() => setModalMode(null)}
          onConfirm={handleSaveCategory}
          confirmLabel={
            isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Category' : 'Save Changes'
          }
          confirmVariant="primary"
          isSubmitting={isSubmitting}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Category Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Fine Jewelry & Gems"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. fine-jewelry"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Parent Category (Optional for Hierarchy)
              </label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">None (Top-Level Category)</option>
                {data.items
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '0.35rem',
                }}
              >
                Description
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Short description for SEO and category page..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="catIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
              />
              <label htmlFor="catIsActive" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                Category is active and visible in navigation
              </label>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
