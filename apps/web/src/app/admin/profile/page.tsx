'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminUserResponse, DepartmentItem } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function AdminProfilePage(): React.ReactElement {
  const [profile, setProfile] = useState<AdminUserResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    designation: '',
    departmentId: 1,
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/profile');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
        setProfileForm({
          firstName: json.data.firstName || '',
          lastName: json.data.lastName || '',
          designation: json.data.designation || '',
          departmentId: json.data.departmentId || 1,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      showToast('error', 'Failed to retrieve administrator profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await adminFetch('/api/departments');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDepartments(json.data);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchDepartments();
  }, [fetchProfile, fetchDepartments]);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await adminFetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          departmentId: Number(profileForm.departmentId),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update profile.');

      showToast('success', 'Profile details updated successfully!');
      fetchProfile();

      // Update sessionStorage so the layout reflects new name
      try {
        const stored = sessionStorage.getItem('tobetake_auth_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.firstName = profileForm.firstName;
          userObj.lastName = profileForm.lastName;
          userObj.designation = profileForm.designation;
          sessionStorage.setItem('tobetake_auth_user', JSON.stringify(userObj));
        }
      } catch {
        // Ignored
      }
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await adminFetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update password.');

      showToast(
        'success',
        'Password successfully changed! Please use your new password next time you sign in.',
      );
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span className="spinner" style={{ marginRight: '0.75rem' }} />
        <span>Loading profile information...</span>
      </div>
    );
  }

  const isSuperAdmin = profile?.roleCode === 'SPADMIN';

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
            {isSuperAdmin
              ? 'Super Admin Profile & Security Settings'
              : 'Admin Profile & Security Settings'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isSuperAdmin
              ? 'Manage your Super Admin platform credentials, contact information, and security settings.'
              : 'Manage your administrator account credentials, contact information, and security settings.'}
          </p>
        </div>
      </div>

      <div className="admin-dash-grid">
        {/* Left: Profile Information */}
        <div className="admin-dash-card">
          <div className="admin-dash-card-header">
            <div className="admin-dash-card-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>
                {isSuperAdmin ? 'Super Admin Profile Information' : 'Personal Profile Information'}
              </span>
            </div>
            <AdminBadge
              status={profile.roleCode}
              label={isSuperAdmin ? 'Super Admin' : profile.role}
            />
          </div>

          <form onSubmit={handleUpdateProfileSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={`@${profile.username}`}
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-cream)', opacity: 0.8 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email (Immutable)</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-cream)', opacity: 0.8 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={profileForm.departmentId}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, departmentId: Number(e.target.value) })
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
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  className="form-input"
                  placeholder="e.g. System Administrator"
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-admin" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Change Password */}
        <div className="admin-dash-card">
          <div className="admin-dash-card-header">
            <div className="admin-dash-card-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Change Password</span>
            </div>
          </div>

          <form onSubmit={handleChangePasswordSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="form-input"
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="form-input"
                  placeholder="Min 8 chars with uppercase, number, symbol"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn-secondary"
                disabled={isChangingPassword}
                style={{ width: '100%' }}
              >
                {isChangingPassword ? 'Updating Password...' : 'Update Password →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
