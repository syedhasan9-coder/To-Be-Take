'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AuditLogItem, PaginatedResult } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function AuditLogsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<AuditLogItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (actionFilter) params.set('action', actionFilter);
      if (roleFilter) params.set('actorRole', roleFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to retrieve audit log entries.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, roleFilter, page]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (actionFilter) params.set('action', actionFilter);
      if (roleFilter) params.set('actorRole', roleFilter);

      const res = await adminFetch(`/api/admin/audit-logs/export?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'success',
          message: 'Audit logs exported to CSV successfully.',
        },
      ]);
    } catch (err) {
      console.error('Failed to export audit logs:', err);
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to export audit logs to CSV.',
        },
      ]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const parseDetails = (details?: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

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
            System &amp; Administrative Audit Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Immutable chronological record of administrative actions, role updates, seller
            approvals, and security events.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}
        >
          {isExporting ? (
            <>
              <span className="spinner" style={{ width: '14px', height: '14px' }} />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, actor, target ID..."
              className="form-input"
              style={{ maxWidth: '280px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ maxWidth: '160px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="">All Roles</option>
              <option value="SPADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="SYSTEM">System</option>
            </select>
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Filter
            </button>
            {(search || actionFilter || roleFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActionFilter('');
                  setRoleFilter('');
                  setPage(1);
                }}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                Reset
              </button>
            )}
          </form>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{data.items.length}</strong> of <strong>{data.total}</strong> log
            entries
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Details</th>
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
                    Loading audit trail...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <code
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-forest-800)',
                          fontSize: '0.82rem',
                        }}
                      >
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.actorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.actorRole} • {log.actorEmail}
                      </div>
                    </td>
                    <td>
                      <div>{log.targetType}</div>
                      {log.targetId && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          ID: {log.targetId.substring(0, 13)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <AdminBadge status={log.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
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

      {/* Inspect Audit Log Modal */}
      {selectedLog && (
        <AdminModal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log Inspection: ${selectedLog.action}`}
          footer={
            <button type="button" onClick={() => setSelectedLog(null)} className="btn-secondary">
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
                Event ID
              </span>
              <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                {selectedLog.id}
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
                Action
              </span>
              <code style={{ fontWeight: 600, color: 'var(--color-forest-800)' }}>
                {selectedLog.action}
              </code>
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
                Actor
              </span>
              <span>
                {selectedLog.actorName} ({selectedLog.actorRole}) • {selectedLog.actorEmail}
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
                Target Entity
              </span>
              <span>
                {selectedLog.targetType} {selectedLog.targetId ? `(${selectedLog.targetId})` : ''}
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
                Status
              </span>
              <AdminBadge status={selectedLog.status} />
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
                Timestamp
              </span>
              <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
            </div>

            {selectedLog.details && (
              <div style={{ marginTop: '0.5rem' }}>
                <div
                  style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}
                >
                  Payload Details
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--color-forest-900)',
                    color: '#a7f3d0',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    overflowX: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {typeof parseDetails(selectedLog.details) === 'object'
                    ? JSON.stringify(parseDetails(selectedLog.details), null, 2)
                    : String(selectedLog.details)}
                </pre>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
