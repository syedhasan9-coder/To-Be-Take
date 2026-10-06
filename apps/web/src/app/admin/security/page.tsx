'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SecurityOverview, UserSessionItem } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminKpiCard } from '@/components/admin/AdminKpiCard';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function SecurityCenterPage(): React.ReactElement {
  const [user, setUser] = useState<{ roleCode?: string } | null>(null);
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<UserSessionItem | null>(null);
  const [forceLogoutUserId, setForceLogoutUserId] = useState<string | null>(null);
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


  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/security/overview');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load security overview:', err);
      showToast('error', 'Failed to retrieve security monitoring data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleRevokeSession = async () => {
    if (!selectedSession) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/security/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to revoke session.');
      }

      showToast('success', `Session for user '@${selectedSession.username}' revoked.`);
      setSelectedSession(null);
      fetchSecurityData();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceLogout = async () => {
    if (!forceLogoutUserId) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/security/users/${forceLogoutUserId}/force-logout`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Force logout failed.');
      }

      showToast('success', json.message || 'User sessions terminated.');
      setForceLogoutUserId(null);
      fetchSecurityData();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
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
          This section is restricted exclusively to platform Super Administrators. Operational administrators do not possess authorization to monitor platform security sessions or force logout users.
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
        <span>Loading platform security center &amp; session telemetry...</span>
      </div>
    );
  }


  if (!data) {
    return (
      <div
        className="card"
        style={{ padding: '2.5rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}
      >
        <div
          style={{
            color: 'var(--error-text)',
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Unable to Load Security Center
        </div>
        <button type="button" onClick={fetchSecurityData} className="btn-admin">
          Retry Loading
        </button>
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
            Security Center &amp; Session Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live authentication telemetry, session revocation controls, and security posture
            monitoring.
          </p>
        </div>
      </div>

      {/* Security KPIs */}
      <div className="admin-kpi-grid">
        <AdminKpiCard
          label="Active User Sessions"
          value={data.activeSessionsCount}
          subtext="Currently authenticated sessions"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Logins Today"
          value={data.totalLoginsToday}
          subtext="Successful authentication events"
          trend={{ value: 'Live', isPositive: true }}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Failed Login Attempts"
          value={data.failedLoginsToday}
          subtext="Recorded failed credential matches"
          trend={data.failedLoginsToday > 0 ? { value: 'Warning', isPositive: false } : undefined}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
        <AdminKpiCard
          label="Locked Accounts"
          value={data.lockedAccountsCount}
          subtext="Accounts temporarily locked"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          }
        />
      </div>

      {/* Active Sessions Table */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Active Authenticated Sessions
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Inspect and remotely terminate active sessions across platform users.
            </p>
          </div>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role</th>
                <th>Session Token</th>
                <th>Device / IP</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.activeSessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                  >
                    No active sessions currently recorded in database.
                  </td>
                </tr>
              ) : (
                data.activeSessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.userEmail}
                      </div>
                    </td>
                    <td>
                      <AdminBadge status={s.userRole} />
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {s.sessionToken}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        {s.deviceInfo || 'Standard Browser'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.ipAddress || '127.0.0.1'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(s.lastActivityAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSession(s)}
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            color: '#dc2626',
                          }}
                        >
                          Revoke Session
                        </button>
                        <button
                          type="button"
                          onClick={() => setForceLogoutUserId(s.userId)}
                          className="btn-secondary"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            color: '#991b1b',
                          }}
                        >
                          Force Logout
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

      {/* Security Policies Overview */}
      <div className="admin-dash-card" style={{ marginTop: '1.5rem' }}>
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Active Security Policies</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            fontSize: '0.86rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--color-forest-800)' }}
            >
              Password Complexity Policy
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Requires minimum 8 characters, uppercase, lowercase, numeric digits, and special
              characters.
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--color-forest-800)' }}
            >
              Super Admin Account Protection
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Enforced at backend layer: Standard administrators cannot modify, suspend, or revoke
              Super Admin privileges.
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--color-forest-800)' }}
            >
              Audit Retention
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              All administrative, seller approval, and status change events recorded permanently in
              PostgreSQL.
            </div>
          </div>
        </div>
      </div>

      {/* Revoke Session Confirmation Modal */}
      {selectedSession && (
        <AdminModal
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          title="Confirm Session Revocation"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSession}
                className="btn-primary"
                style={{ backgroundColor: '#dc2626' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            Are you sure you want to terminate session <code>{selectedSession.sessionToken}</code>{' '}
            for user <strong>@{selectedSession.username}</strong>?
          </p>
        </AdminModal>
      )}

      {/* Force Logout Confirmation Modal */}
      {forceLogoutUserId && (
        <AdminModal
          isOpen={Boolean(forceLogoutUserId)}
          onClose={() => setForceLogoutUserId(null)}
          title="Confirm User Force Logout"
          footer={
            <>
              <button
                type="button"
                onClick={() => setForceLogoutUserId(null)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceLogout}
                className="btn-primary"
                style={{ backgroundColor: '#991b1b' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Force Logout User'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            Are you sure you want to invalidate all active login sessions for this user? They will
            be immediately required to re-authenticate.
          </p>
        </AdminModal>
      )}
    </div>
  );
}
