'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { sellerFetch, getStoredAuthUser, setStoredAuthUser } from '@/lib/api';

interface SellerProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  storeName?: string | null;
  businessCategory?: string | null;
  status: string;
  approvalStatus?: string;
  phone?: string | null;
  description?: string | null;
  address?: string | null;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SellerProfilePage(): React.ReactElement {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    storeName: '',
    businessCategory: '',
    firstName: '',
    lastName: '',
    phone: '',
    description: '',
    address: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sellerFetch('/api/seller/profile');

      if (!res.ok) {
        throw new Error('Failed to load store profile');
      }

      const json = await res.json();
      const data: SellerProfile = json.data || json;
      setProfile(data);
      setForm({
        storeName: data.storeName || '',
        businessCategory: data.businessCategory || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        description: data.description || '',
        address: data.address || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        storeName: form.storeName.trim(),
        businessCategory: form.businessCategory.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        description: form.description.trim() || undefined,
      };

      const res = await sellerFetch('/api/seller/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update profile');
      }

      const updated: SellerProfile = json.data || json;
      setProfile(updated);

      // Update stored user storeName in both storages
      const currentStored = getStoredAuthUser();
      if (currentStored) {
        setStoredAuthUser({
          ...currentStored,
          storeName: updated.storeName,
          firstName: updated.firstName,
          lastName: updated.lastName,
          businessCategory: updated.businessCategory,
        });
      }

      setSuccess('Store profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update store profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            ✓ Verified &amp; Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge badge-warning" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            ⏳ Under Verification
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge badge-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            ✕ Approval Rejected
          </span>
        );
      default:
        return (
          <span className="badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="seller-profile-page" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a3322', margin: 0 }}>
            Store Profile &amp; Settings
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
            Manage your storefront identity, business credentials, and contact details.
          </p>
        </div>
        <div>
          {profile?.approvalStatus && getStatusBadge(profile.approvalStatus)}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.875rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.875rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
          Loading profile...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Store Overview Card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '12px', backgroundColor: '#1a3322', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', flexShrink: 0 }}>
              {form.storeName ? form.storeName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1a3322' }}>
                  {form.storeName || 'Store Name'}
                </h2>
                <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: '#f5f0eb', color: '#555' }}>
                  {form.businessCategory || 'Marketplace Vendor'}
                </span>
              </div>
              <p style={{ color: '#555', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {form.description || 'No public store description provided yet.'}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#777', flexWrap: 'wrap' }}>
                <span>✉ {profile?.email}</span>
                {form.phone && <span>📞 {form.phone}</span>}
                <span>👤 {form.firstName} {form.lastName}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a3322', marginBottom: '1.25rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
              Edit Storefront Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="e.g. Al-Madina Electronics & Gadgets"
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  Primary Business Category
                </label>
                <input
                  type="text"
                  value={form.businessCategory}
                  onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                  placeholder="e.g. Electronics & Gadgets"
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="First Name"
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                  Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', color: '#64748b' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                Store Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your brand, products, and customer satisfaction standards..."
                className="input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#777' }}>
                🔒 Server-side ownership and identity validation is strictly enforced.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="btn-seller"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 600 }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
