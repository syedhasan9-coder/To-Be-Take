import React from 'react';

interface AdminKpiCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const AdminKpiCard: React.FC<AdminKpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
}) => {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-top">
        <span className="admin-kpi-label">{label}</span>
        <div className="admin-kpi-icon-box">{icon}</div>
      </div>
      <div className="admin-kpi-value">{value}</div>
      {(subtext || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {trend && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: trend.isPositive ? 'var(--success-text)' : 'var(--error-text)',
                backgroundColor: trend.isPositive ? 'var(--success-bg)' : 'var(--error-bg)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="admin-kpi-subtext">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
