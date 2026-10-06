'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PermissionItem, RolePermissionsResponse } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

interface RoleOption {
  id: number;
  name: string;
  code: string;
  description?: string;
  _count?: { users: number };
}

export default function RolesPermissionsPage(): React.ReactElement {
  const [user, setUser] = useState<{ roleCode?: string } | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(2); // Default to Admin
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsResponse | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
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


  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchRoles = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/roles-permissions/roles');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRoles(json.data);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
      showToast('error', 'Failed to load roles directory.');
    }
  }, []);

  const fetchRolePermissions = useCallback(async (roleId: number) => {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/roles-permissions/${roleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRolePermissions(json.data);
        const grantedIds = new Set<number>(json.data.permissions.map((p: PermissionItem) => p.id));
        setSelectedPermissionIds(grantedIds);
      }
    } catch (err) {
      console.error('Failed to load role permissions:', err);
      showToast('error', 'Failed to load permissions for role.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, fetchRolePermissions]);

  const handleTogglePermission = (id: number) => {
    if (rolePermissions?.roleCode === 'SPADMIN') {
      showToast(
        'info',
        'The Super Admin role possesses universal platform permissions and cannot be modified.',
      );
      return;
    }
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!rolePermissions) return;
    setIsSaving(true);
    try {
      const res = await adminFetch('/api/admin/roles-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: rolePermissions.roleId,
          permissionIds: Array.from(selectedPermissionIds),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update role permissions.');
      }

      showToast(
        'success',
        `Permissions updated successfully for role '${rolePermissions.roleName}'`,
      );
      fetchRolePermissions(selectedRoleId);
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Group all permissions by category
  const categoriesMap = new Map<string, PermissionItem[]>();
  if (rolePermissions?.allPermissions) {
    for (const p of rolePermissions.allPermissions) {
      const cat = p.category || 'General';
      if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
      categoriesMap.get(cat)!.push(p);
    }
  }

  const isSuperAdmin = rolePermissions?.roleCode === 'SPADMIN';

  if (user && user.roleCode !== 'SPADMIN') {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Super Admin Privileges Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          This section is restricted exclusively to platform Super Administrators. Operational administrators do not possess governance authorization to configure roles and permissions.
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
            Roles &amp; Granular Permissions (RBAC)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage platform access capabilities, assign operational privileges, and enforce
            role-based security boundaries.
          </p>
        </div>
        {!isSuperAdmin && (
          <button
            type="button"
            onClick={handleSavePermissions}
            className="btn-admin"
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving Changes...' : 'Save Role Permissions'}
          </button>
        )}
      </div>

      {/* Role Selection Tabs */}
      <div className="admin-tabs">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            className={`admin-tab-btn ${selectedRoleId === role.id ? 'active' : ''}`}
          >
            {role.name} ({role.code})
          </button>
        ))}
      </div>

      {isLoading || !rolePermissions ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span className="spinner" style={{ marginRight: '0.5rem' }} />
          Loading permissions matrix...
        </div>
      ) : (
        <div>
          {/* Role Summary Banner */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  {rolePermissions.roleName}
                </span>
                <AdminBadge status={rolePermissions.roleCode} />
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isSuperAdmin
                  ? 'The Super Administrator has full, unrestricted access across all platform modules and settings.'
                  : `Configuring ${selectedPermissionIds.size} granted operational permissions for this role.`}
              </p>
            </div>

            {isSuperAdmin && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: '#fdf4ff',
                  color: '#86198f',
                  border: '1px solid #f0abfc',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                🔒 Full Universal Privileges Locked
              </span>
            )}
          </div>

          {/* Permissions Matrix by Category */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {Array.from(categoriesMap.entries()).map(([category, perms]) => (
              <div
                key={category}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{category}</span>
                  <span
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}
                  >
                    {perms.filter((p) => selectedPermissionIds.has(p.id) || isSuperAdmin).length} /{' '}
                    {perms.length} Active
                  </span>
                </div>

                <div
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {perms.map((p) => {
                    const isChecked = selectedPermissionIds.has(p.id) || isSuperAdmin;

                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          cursor: isSuperAdmin ? 'default' : 'pointer',
                          padding: '0.4rem 0.25rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuperAdmin}
                          onChange={() => handleTogglePermission(p.id)}
                          style={{
                            marginTop: '0.2rem',
                            accentColor: 'var(--color-forest-800)',
                            width: '16px',
                            height: '16px',
                            cursor: isSuperAdmin ? 'default' : 'pointer',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.86rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.name}{' '}
                            <code
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                marginLeft: '0.3rem',
                              }}
                            >
                              {p.code}
                            </code>
                          </div>
                          {p.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {p.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
