'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PaginatedResult, SellerApprovalItem, SellerApprovalStatus } from '@tobetake/shared-types';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { adminFetch } from '@/lib/api';

export default function SellerApprovalsPage(): React.ReactElement {
  const [data, setData] = useState<PaginatedResult<SellerApprovalItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusTab, setStatusTab] = useState<string>('PENDING');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedApproval, setSelectedApproval] = useState<SellerApprovalItem | null>(null);
  const [actionApproval, setActionApproval] = useState<{
    item: SellerApprovalItem;
    targetStatus: SellerApprovalStatus;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusTab && statusTab !== 'ALL') params.set('status', statusTab);
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await adminFetch(`/api/admin/seller-approvals?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch seller approvals:', err);
      showToast('error', 'Failed to load seller approvals queue.');
    } finally {
      setIsLoading(false);
    }
  }, [statusTab, search, page]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleExecuteAction = async () => {
    if (!actionApproval) return;
    setIsSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/seller-approvals/${actionApproval.item.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionApproval.targetStatus,
          notes: actionNotes.trim() || undefined,
          reason: rejectionReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Action failed.');
      }

      showToast(
        'success',
        `Seller store '${actionApproval.item.storeName || actionApproval.item.sellerUsername}' is now ${actionApproval.targetStatus}`,
      );
      setActionApproval(null);
      setActionNotes('');
      setRejectionReason('');
      fetchApprovals();
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
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
            Seller Onboarding &amp; Approvals
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review vendor registrations, inspect merchant business categories, verify seller
            credentials, and grant store access.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          onClick={() => {
            setStatusTab('PENDING');
            setPage(1);
          }}
          className={`admin-tab-btn ${statusTab === 'PENDING' ? 'active' : ''}`}
        >
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusTab('APPROVED');
            setPage(1);
          }}
          className={`admin-tab-btn ${statusTab === 'APPROVED' ? 'active' : ''}`}
        >
          Approved Stores
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusTab('REJECTED');
            setPage(1);
          }}
          className={`admin-tab-btn ${statusTab === 'REJECTED' ? 'active' : ''}`}
        >
          Rejected
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusTab('SUSPENDED');
            setPage(1);
          }}
          className={`admin-tab-btn ${statusTab === 'SUSPENDED' ? 'active' : ''}`}
        >
          Suspended
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusTab('ALL');
            setPage(1);
          }}
          className={`admin-tab-btn ${statusTab === 'ALL' ? 'active' : ''}`}
        >
          All Applications
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchApprovals();
            }}
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flex: 1,
              maxWidth: '420px',
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store name, category, or applicant..."
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Search
            </button>
          </form>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{data.items.length}</strong> applications (Total:{' '}
            <strong>{data.total}</strong>)
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Store &amp; Category</th>
                <th>Applicant / Merchant</th>
                <th>Approval Status</th>
                <th>Submitted Date</th>
                <th>Reviewed By</th>
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
                    Loading seller approvals queue...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
                  >
                    No seller applications found under current filter.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.storeName || 'Unnamed Storefront'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold-text)' }}>
                        {item.businessCategory || 'General Merchandise'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.sellerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        @{item.sellerUsername} • {item.sellerEmail}
                      </div>
                    </td>
                    <td>
                      <AdminBadge status={item.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {item.reviewedByName || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedApproval(item)}
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Details
                        </button>
                        {item.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionApproval({ item, targetStatus: 'APPROVED' });
                              setActionNotes('');
                            }}
                            className="btn-admin"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            Approve
                          </button>
                        )}
                        {item.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionApproval({ item, targetStatus: 'REJECTED' });
                              setRejectionReason('');
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.78rem',
                              color: '#dc2626',
                            }}
                          >
                            Reject
                          </button>
                        )}
                        {item.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionApproval({ item, targetStatus: 'SUSPENDED' });
                              setActionNotes('');
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.78rem',
                              color: '#dc2626',
                            }}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
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

      {/* Seller Approval Details Modal */}
      {selectedApproval && (
        <AdminModal
          isOpen={Boolean(selectedApproval)}
          onClose={() => setSelectedApproval(null)}
          title={`Seller Onboarding Application: ${selectedApproval.storeName || selectedApproval.sellerUsername}`}
          footer={
            <div
              style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}
            >
              {selectedApproval.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedApproval;
                    setSelectedApproval(null);
                    setActionApproval({ item, targetStatus: 'APPROVED' });
                  }}
                  className="btn-admin"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Approve Store →
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
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
                Store Name
              </span>
              <span className="detail-value" style={{ fontWeight: 700 }}>
                {selectedApproval.storeName || 'N/A'}
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
                Business Category
              </span>
              <span>{selectedApproval.businessCategory || 'N/A'}</span>
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
                Merchant Owner
              </span>
              <span>
                {selectedApproval.sellerName} (@{selectedApproval.sellerUsername})
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
                Contact Email
              </span>
              <span>{selectedApproval.sellerEmail}</span>
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
                Onboarding Status
              </span>
              <AdminBadge status={selectedApproval.status} />
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
                Submitted Date
              </span>
              <span>{new Date(selectedApproval.submittedAt).toLocaleString()}</span>
            </div>
            {selectedApproval.reviewedByName && (
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
                  Reviewed By
                </span>
                <span>
                  {selectedApproval.reviewedByName} (
                  {new Date(selectedApproval.reviewedAt || '').toLocaleDateString()})
                </span>
              </div>
            )}
            {selectedApproval.rejectionReason && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.2rem' }}>
                  Rejection Reason
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {selectedApproval.rejectionReason}
                </div>
              </div>
            )}
            {selectedApproval.notes && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.2rem',
                  }}
                >
                  Reviewer Notes
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {selectedApproval.notes}
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Action Review Confirmation Modal */}
      {actionApproval && (
        <AdminModal
          isOpen={Boolean(actionApproval)}
          onClose={() => setActionApproval(null)}
          title={`Confirm ${actionApproval.targetStatus} Action`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActionApproval(null)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={actionApproval.targetStatus === 'APPROVED' ? 'btn-admin' : 'btn-primary'}
                style={{
                  backgroundColor:
                    actionApproval.targetStatus === 'REJECTED' ||
                    actionApproval.targetStatus === 'SUSPENDED'
                      ? '#dc2626'
                      : undefined,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${actionApproval.targetStatus}`}
              </button>
            </>
          }
        >
          <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            Are you sure you want to mark store{' '}
            <strong>{actionApproval.item.storeName || actionApproval.item.sellerUsername}</strong>{' '}
            as <strong>{actionApproval.targetStatus}</strong>?
          </p>

          {actionApproval.targetStatus === 'REJECTED' && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Rejection Reason *</label>
              <input
                type="text"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete business documents, restricted category"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Internal Audit Notes (Optional)</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Internal reviewer notes for audit trail"
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </AdminModal>
      )}
    </div>
  );
}
