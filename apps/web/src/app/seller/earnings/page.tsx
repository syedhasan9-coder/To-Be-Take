'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SellerEarningsSummary } from '@tobetake/shared-types';
import { sellerFetch } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function SellerEarningsPage(): React.ReactElement {
  const [data, setData] = useState<SellerEarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sellerFetch('/api/seller/finance/earnings');
      if (!res.ok) throw new Error('Failed to load financial records');
      const json = await res.json();
      setData(json.data || json);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching earnings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Calculating store financials...</p>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
            Financial Ledger Unavailable
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{errorMessage}</p>
          <button type="button" onClick={fetchEarnings} className="btn-seller">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
          Earnings &amp; Financial Settlement
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Comprehensive financial overview of item sales, marketplace platform deductions, and disbursement ledgers.
        </p>
      </div>

      {/* 6 Financial Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Gross Sales
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1b4332' }}>
            {formatPKR(data.grossSales)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Total product value</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Platform Fees Paid
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b91c1c' }}>
            -{formatPKR(data.platformFees)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Marketplace commission</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Refund Deductions
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#64748b' }}>
            -{formatPKR(data.refundDeductions)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Resolved customer returns</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#faf8f5', borderColor: '#d4a373' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Net Store Earnings
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92400e' }}>
            {formatPKR(data.netEarnings)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.25rem' }}>Total earned to date</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Disbursed Payouts
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857' }}>
            {formatPKR(data.totalPaidOut)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Paid to bank account</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Pending Balance
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1' }}>
            {formatPKR(data.pendingBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Awaiting next payout cycle</div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2d9cc', background: '#faf8f5' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1b4332', margin: 0 }}>
            Order Commission Ledger
          </h2>
        </div>

        {data.transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p>No earnings transactions recorded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Gross Sale</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Commission Rate</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Platform Fee</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Your Net Earning</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      <Link href={`/seller/orders/${tx.orderId}`} style={{ color: '#1b4332', textDecoration: 'none' }}>
                        {tx.orderNumber || tx.orderId}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                      {formatPKR(tx.orderAmount)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {Number(tx.commissionRate)}%
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#b91c1c' }}>
                      -{formatPKR(tx.platformFee)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#15803d' }}>
                      {formatPKR(tx.sellerEarnings)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: tx.status === 'PAID' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                          color: tx.status === 'PAID' ? '#15803d' : '#b45309',
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
