'use client';

import React, { useEffect, useState } from 'react';
import { useCustomer } from '../../../../components/customer/CustomerContext';
import { customerApi } from '../../../../lib/customer-api';

export default function AccountProfilePage(): React.ReactElement {
  const { user, login } = useCustomer();

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await customerApi.getProfile();
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhone(data.phone || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await customerApi.updateProfile({
        firstName,
        lastName,
        phone,
      });
      if (user) {
        login(localStorage.getItem('tobetake_customer_token') || '', {
          ...user,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
        });
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    setPasswordSaving(true);
    try {
      await customerApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Personal Information */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.35rem' }}>
          Personal Information
        </h2>
        <p style={{ color: '#526359', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          Update your basic profile name and contact telephone number.
        </p>

        {profileSuccess && (
          <div style={{ background: '#e6f4ec', border: '1px solid #b6e2c8', color: '#196338', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
            ✓ Profile details updated successfully!
          </div>
        )}

        <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              First Name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              Last Name
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              Email Address (Cannot be changed)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e8e3d9', background: '#f0ebe1', color: '#82948a', cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              Mobile Phone (+92)
            </label>
            <input
              type="text"
              placeholder="+92 300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={profileSaving}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
            >
              {profileSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Security & Password Update */}
      <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14291f', margin: '0 0 0.35rem' }}>
          Security & Password
        </h2>
        <p style={{ color: '#526359', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          Ensure your customer account is using a strong and unique password.
        </p>

        {passwordSuccess && (
          <div style={{ background: '#e6f4ec', border: '1px solid #b6e2c8', color: '#196338', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
            ✓ Your password has been changed successfully!
          </div>
        )}

        {passwordError && (
          <div style={{ background: '#fdf2f2', border: '1px solid #f8c8c8', color: '#a82323', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
            ⚠️ {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              New Password (min 8 chars) *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#14291f', marginBottom: '0.35rem' }}>
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #dcd5c7', background: '#f8f5ee' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={passwordSaving}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
