'use client';

import React from 'react';
import { PlatformGrowthPoint } from '@tobetake/shared-types';

interface AdminGrowthChartProps {
  data: PlatformGrowthPoint[];
}

export const AdminGrowthChart: React.FC<AdminGrowthChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        Insufficient historical growth data available to plot timeline.
      </div>
    );
  }

  const maxCustomer = Math.max(...data.map((d) => d.customers), 1);
  const maxSeller = Math.max(...data.map((d) => d.sellers), 1);
  const maxAdmin = Math.max(...data.map((d) => d.admins), 1);
  const globalMax = Math.max(maxCustomer, maxSeller, maxAdmin, 10);

  const height = 200;
  const width = 600;
  const paddingX = 40;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return height - paddingY - (val / globalMax) * chartHeight;
  };

  const generatePath = (getter: (d: PlatformGrowthPoint) => number) => {
    if (data.length === 1) {
      const x = getX(0);
      const y = getY(getter(data[0]));
      return `M ${x - 20} ${y} L ${x + 20} ${y}`;
    }
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(getter(d))}`).join(' ');
  };

  const customerPath = generatePath((d) => d.customers);
  const sellerPath = generatePath((d) => d.sellers);
  const adminPath = generatePath((d) => d.admins);

  return (
    <div style={{ width: '100%' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              width: '12px',
              height: '3px',
              backgroundColor: '#1f4a37',
              borderRadius: '2px',
            }}
          />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Customers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              width: '12px',
              height: '3px',
              backgroundColor: '#d4a34b',
              borderRadius: '2px',
            }}
          />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sellers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              width: '12px',
              height: '3px',
              backgroundColor: '#526359',
              borderRadius: '2px',
            }}
          />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Admins</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = height - paddingY - ratio * chartHeight;
          const val = Math.round(ratio * globalMax);
          return (
            <g key={i}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        <path
          d={customerPath}
          fill="none"
          stroke="#1f4a37"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={sellerPath}
          fill="none"
          stroke="#d4a34b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={adminPath}
          fill="none"
          stroke="#526359"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <g key={i}>
              {/* Customer dot */}
              <circle
                cx={x}
                cy={getY(d.customers)}
                r="3.5"
                fill="#1f4a37"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Seller dot */}
              <circle
                cx={x}
                cy={getY(d.sellers)}
                r="3.5"
                fill="#d4a34b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Admin dot */}
              <circle
                cx={x}
                cy={getY(d.admins)}
                r="3.5"
                fill="#526359"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Date label on X axis */}
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-secondary)"
                fontWeight="500"
              >
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
