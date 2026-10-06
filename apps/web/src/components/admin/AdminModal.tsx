'use client';

import React, { useEffect } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isSubmitting?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
  onConfirm,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isSubmitting = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultFooter = onConfirm ? (
    <>
      <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-admin'}
        disabled={isSubmitting}
        style={{
          background: confirmVariant === 'danger' ? 'var(--error-bg)' : undefined,
          color: confirmVariant === 'danger' ? 'var(--error-text)' : undefined,
          borderColor: confirmVariant === 'danger' ? 'var(--error-border)' : undefined,
        }}
      >
        {isSubmitting ? 'Processing...' : confirmLabel}
      </button>
    </>
  ) : null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="admin-modal-box" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0.25rem',
              cursor: 'pointer',
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>

        {(footer || defaultFooter) && (
          <div className="admin-modal-footer">{footer || defaultFooter}</div>
        )}
      </div>
    </div>
  );
};
