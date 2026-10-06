'use client';

import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const AdminToast: React.FC<AdminToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss(toasts[0].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 2000,
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSuccess ? '#14291f' : isError ? '#991b1b' : '#1e293b',
              color: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.875rem',
              border: isSuccess
                ? '1px solid #2d6a4f'
                : isError
                  ? '1px solid #ef4444'
                  : '1px solid #475569',
            }}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0 0.25rem',
              }}
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
