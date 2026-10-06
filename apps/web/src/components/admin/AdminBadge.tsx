import React from 'react';

interface AdminBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ status, label, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();

  const getDisplayLabel = () => {
    if (label) return label;
    if (normalized === 'spadmin') return 'Super Admin';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'vendor') return 'Seller';
    if (normalized === 'cust') return 'Customer';
    return (status || '').replace(/_/g, ' ');
  };

  const displayLabel = getDisplayLabel();

  return (
    <span
      className={`admin-badge admin-badge-${normalized}`}
      style={{
        fontSize: size === 'sm' ? '0.68rem' : '0.74rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.2rem 0.65rem',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      <span>{displayLabel}</span>
    </span>
  );
};
