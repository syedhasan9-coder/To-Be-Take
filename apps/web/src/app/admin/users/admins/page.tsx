'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DepartmentItem, ManagedUserItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function AdminsManagementPage(): React.ReactElement {
  const [user, setUser] = useState<{ roleCode?: string } | null>(null);
  const [data, setData] = useState<PaginatedResult<ManagedUserItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<ManagedUserItem | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<ManagedUserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tobetake_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Storage read error
    }
  }, []);


  // Form State for creating admin
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    departmentId: 1,
    designation: '',
  });

  // Form State for editing admin
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    departmentId: 1,
    designation: '',
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/users/admins?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
      showToast('error', 'Failed to load administrator accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await adminFetch('/api/departments');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDepartments(json.data);
          if (json.data.length > 0) {
            setCreateForm((prev) => ({ ...prev, departmentId: json.data[0].id }));
          }
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchDepartments();
  }, [fetchAdmins, fetchDepartments]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/users/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          departmentId: Number(createForm.departmentId),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to create administrator account.');
      }

      showToast('success', `Admin account '@${createForm.username}' created successfully!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        departmentId: departments[0]?.id || 1,
        designation: '',
      });
      fetchAdmins();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOpen = (admin: ManagedUserItem) => {
    setEditingAdmin(admin);
    setEditForm({
      firstName: admin.firstName,
      lastName: admin.lastName,
      departmentId: admin.departmentId || departments[0]?.id || 1,
      designation: admin.designation || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/users/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          departmentId: Number(editForm.departmentId),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update administrator account.');
      }

      showToast('success', `Admin account '@${editingAdmin.username}' updated.`);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: ManagedUserItem) => {
    const newStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminFetch(`/api/admin/users/${admin.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Status change rejected.');
      }

      showToast('success', `Status for '@${admin.username}' changed to ${newStatus}`);
      fetchAdmins();
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  if (user && user.roleCode !== 'SPADMIN') {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Super Admin Privileges Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          This section is restricted exclusively to platform Super Administrators. Operational administrators do not possess authorization to create, edit, or manage administrator accounts.
        </p>
        <Link href="/admin/dashboard" className="btn-admin">
          Return to Operational Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminToast

        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Tabs */}
      <div className="admin-tabs">
        <Link href="/admin/users/customers" className="admin-tab-btn">
          Customers / Buyers
        </Link>
        <Link href="/admin/users/sellers" className="admin-tab-btn">
          Sellers / Vendors
        </Link>
        <Link href="/admin/users/admins" className="admin-tab-btn active">
          Administrators
        </Link>
      </div>

      <div className="admin-page-header">
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Administrator Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage internal platform administrators, department assignments, designations, and
            security access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-admin"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>+ Create Admin Account</span>
        </button>
      </div>

      {/* Table & Filter */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '380px' }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin name, username, department..."
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{data.items.length}</strong> of <strong>{data.total}</strong>{' '}
            administrators
          </div>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    <span className="spinner" style={{ marginRight: '0.5rem' }} />
                    Loading administrator accounts...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                data.items.map((admin) => {
                  const isSuper = admin.roleCode === 'SPADMIN';

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {admin.firstName} {admin.lastName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          @{admin.username} • {admin.email}
                        </div>
                      </td>
                      <td>
                        <AdminBadge status={admin.roleCode} label={admin.role} />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem' }}>{admin.department || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem' }}>{admin.designation || '—'}</span>
                      </td>
                      <td>
                        <AdminBadge status={admin.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedAdmin(admin)}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditOpen(admin)}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            Edit
                          </button>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(admin)}
                              className="btn-secondary"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.78rem',
                                color: admin.status === 'ACTIVE' ? '#dc2626' : '#166534',
                              }}
                            >
                              {admin.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-secondary)',
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Administrator Account"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                required
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                className="form-input"
                placeholder="e.g. Sana"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                required
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                className="form-input"
                placeholder="e.g. Mirza"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="form-input"
                placeholder="e.g. sana.ops"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="form-input"
                placeholder="e.g. sana.m@tobetake.dev"
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">
                Password * (Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Symbol)
              </label>
              <input
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="form-input"
                placeholder="Enter secure initial password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                value={createForm.departmentId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, departmentId: Number(e.target.value) })
                }
                className="form-select"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input
                type="text"
                required
                value={createForm.designation}
                onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                className="form-input"
                placeholder="e.g. Operations Specialist"
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-admin" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <AdminModal
          isOpen={Boolean(editingAdmin)}
          onClose={() => setEditingAdmin(null)}
          title={`Edit Administrator: @${editingAdmin.username}`}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, departmentId: Number(e.target.value) })
                  }
                  className="form-select"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <input
                  type="text"
                  required
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-admin" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Admin Details Modal */}
      {selectedAdmin && (
        <AdminModal
          isOpen={Boolean(selectedAdmin)}
          onClose={() => setSelectedAdmin(null)}
          title={`Administrator Details: ${selectedAdmin.firstName} ${selectedAdmin.lastName}`}
          footer={
            <button type="button" onClick={() => setSelectedAdmin(null)} className="btn-secondary">
              Close
            </button>
          }
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              fontSize: '0.88rem',
            }}
          >
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Account ID
              </span>
              <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                {selectedAdmin.id}
              </span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Username
              </span>
              <span className="detail-value">@{selectedAdmin.username}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Role
              </span>
              <AdminBadge status={selectedAdmin.roleCode} label={selectedAdmin.role} />
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Department
              </span>
              <span>{selectedAdmin.department || 'Administration'}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Designation
              </span>
              <span>{selectedAdmin.designation || 'System Administrator'}</span>
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Status
              </span>
              <AdminBadge status={selectedAdmin.status} />
            </div>
            <div
              className="detail-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="detail-label" style={{ color: 'var(--text-secondary)' }}>
                Created At
              </span>
              <span>{new Date(selectedAdmin.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
