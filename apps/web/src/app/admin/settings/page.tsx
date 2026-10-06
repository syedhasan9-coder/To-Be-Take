'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PlatformSettingItem } from '@tobetake/shared-types';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function PlatformSettingsPage(): React.ReactElement {
  const [user, setUser] = useState<{ roleCode?: string } | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<
    'general' | 'registration' | 'maintenance' | 'security' | 'notifications'
  >('general');
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

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        const initialForm: Record<string, string> = {};
        const allItems: PlatformSettingItem[] = [
          ...json.data.general,
          ...json.data.registration,
          ...json.data.maintenance,
          ...json.data.security,
          ...json.data.notifications,
        ];
        for (const item of allItems) {
          initialForm[item.key] = item.value;
        }
        setFormState(initialForm);
      }
    } catch (err) {
      console.error('Failed to load platform settings:', err);
      showToast('error', 'Failed to retrieve platform configuration settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.entries(formState).map(([key, value]) => ({ key, value }));

      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save settings.');
      }

      showToast('success', 'Platform settings successfully updated and persisted to database!');
      fetchSettings();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSaving(false);
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
          This section is restricted exclusively to platform Super Administrators. Operational administrators do not possess authorization to alter global platform settings or registration policies.
        </p>
        <Link href="/admin/dashboard" className="btn-admin">
          Return to Operational Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span className="spinner" style={{ marginRight: '0.75rem' }} />
        <span>Loading platform configuration...</span>
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
            Platform Configuration &amp; Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure marketplace operational modes, buyer &amp; seller registration toggles,
            security thresholds, and system alerts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`admin-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('registration')}
          className={`admin-tab-btn ${activeTab === 'registration' ? 'active' : ''}`}
        >
          Registration Policies
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`admin-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
        >
          Maintenance Mode
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
        >
          Security &amp; Sessions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`admin-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          System Notifications
        </button>
      </div>

      {/* Form Container */}
      <div className="admin-dash-card" style={{ maxWidth: '840px' }}>
        <form onSubmit={handleSaveSettings}>
          {/* 1. General Tab */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Platform Display Name</label>
                <input
                  type="text"
                  value={formState['platform_name'] || ''}
                  onChange={(e) => handleInputChange('platform_name', e.target.value)}
                  className="form-input"
                  placeholder="e.g. To Be Take Marketplace"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform Operating Status</label>
                <select
                  value={formState['platform_status'] || 'ONLINE'}
                  onChange={(e) => handleInputChange('platform_status', e.target.value)}
                  className="form-select"
                >
                  <option value="ONLINE">ONLINE (Normal Operation)</option>
                  <option value="DEGRADED">DEGRADED (Reduced Performance Notice)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Access Restricted)</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. Registration Tab */}
          {activeTab === 'registration' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Customer / Buyer Registration
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Allow public visitors to register new buyer accounts across web and mobile
                    applications.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('customer_registration_enabled')}
                  className={
                    formState['customer_registration_enabled'] === 'true'
                      ? 'btn-admin'
                      : 'btn-secondary'
                  }
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  {formState['customer_registration_enabled'] === 'true' ? 'Enabled ✓' : 'Disabled'}
                </button>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Seller / Vendor Registration
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Allow merchants and vendors to submit onboarding registration requests.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('seller_registration_enabled')}
                  className={
                    formState['seller_registration_enabled'] === 'true'
                      ? 'btn-admin'
                      : 'btn-secondary'
                  }
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  {formState['seller_registration_enabled'] === 'true' ? 'Enabled ✓' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* 3. Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor:
                    formState['maintenance_mode'] === 'true' ? '#fef2f2' : 'var(--bg-cream)',
                  border:
                    formState['maintenance_mode'] === 'true'
                      ? '1px solid #fecaca'
                      : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        formState['maintenance_mode'] === 'true'
                          ? '#991b1b'
                          : 'var(--text-primary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Platform Maintenance Mode
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    When active, public customer and seller portals display the maintenance screen.
                    Admin portals remain accessible.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('maintenance_mode')}
                  className={
                    formState['maintenance_mode'] === 'true' ? 'btn-primary' : 'btn-secondary'
                  }
                  style={{
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.85rem',
                    backgroundColor:
                      formState['maintenance_mode'] === 'true' ? '#dc2626' : undefined,
                  }}
                >
                  {formState['maintenance_mode'] === 'true'
                    ? '🚨 Active (Restricted)'
                    : 'Inactive (Normal)'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance Notice Message</label>
                <textarea
                  value={formState['maintenance_message'] || ''}
                  onChange={(e) => handleInputChange('maintenance_message', e.target.value)}
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="Message displayed to visitors during platform maintenance"
                />
              </div>
            </div>
          )}

          {/* 4. Security Tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={formState['session_timeout_minutes'] || '120'}
                  onChange={(e) => handleInputChange('session_timeout_minutes', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Failed Login Attempts Before Lockout</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={formState['max_login_attempts'] || '5'}
                  onChange={(e) => handleInputChange('max_login_attempts', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Log Retention Period (Days)</label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={formState['admin_audit_retention_days'] || '90'}
                  onChange={(e) => handleInputChange('admin_audit_retention_days', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* 5. Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Transactional Email Notifications
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    System dispatch of registration, verification, and password reset emails.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('email_notifications_enabled')}
                  className={
                    formState['email_notifications_enabled'] === 'true'
                      ? 'btn-admin'
                      : 'btn-secondary'
                  }
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  {formState['email_notifications_enabled'] === 'true' ? 'Enabled ✓' : 'Disabled'}
                </button>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Critical Admin Security Alerts
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Send high-priority notifications to administrators on failed login spikes and
                    account locks.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('admin_alert_notifications')}
                  className={
                    formState['admin_alert_notifications'] === 'true'
                      ? 'btn-admin'
                      : 'btn-secondary'
                  }
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  {formState['admin_alert_notifications'] === 'true' ? 'Enabled ✓' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="submit"
              className="btn-admin"
              disabled={isSaving}
              style={{ minWidth: '180px' }}
            >
              {isSaving ? 'Saving to Database...' : 'Save Settings Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
