'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { customerApi } from '../../../../lib/customer-api';

export default function AccountOrdersPage(): React.ReactElement {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await customerApi.getOrders(statusFilter === 'ALL' ? undefined : statusFilter);
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [statusFilter]);

  const tabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'In Transit / Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e3d9', borderRadius: '16px', padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: '1.75rem', fontWeight: 700, color: '#14291f', margin: 0 }}>
          My Orders & Consignment Tracking
        </h1>
        <p style={{ color: '#526359', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Track delivery progress, download invoices, or request returns across Pakistan.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #f0ebe1', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: statusFilter === tab.value ? '#14291f' : '#f8f5ee',
              color: statusFilter === tab.value ? '#ffffff' : '#526359',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#526359' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>📦</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14291f', margin: '0.75rem 0 0.35rem' }}>
            No orders found in this category
          </h3>
          <p style={{ color: '#82948a', fontSize: '0.8125rem' }}>
            When you place an order, its details and courier timeline will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: '1px solid #e8e3d9',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              {/* Order Card Header */}
              <div
                style={{
                  background: '#f8f5ee',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '1px solid #e8e3d9',
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#82948a', textTransform: 'uppercase', fontWeight: 700 }}>Order Number</span>
                    <p style={{ fontWeight: 800, color: '#14291f', fontSize: '0.9375rem', margin: 0 }}>#{order.orderNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#82948a', textTransform: 'uppercase', fontWeight: 700 }}>Date Placed</span>
                    <p style={{ fontWeight: 600, color: '#526359', fontSize: '0.8125rem', margin: 0 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#82948a', textTransform: 'uppercase', fontWeight: 700 }}>Total (PKR)</span>
                    <p style={{ fontWeight: 800, color: '#14291f', fontSize: '0.9375rem', margin: 0 }}>
                      Rs. {Number(order.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      background: order.status === 'CANCELLED' ? '#fdf2f2' : '#e6f4ec',
                      color: order.status === 'CANCELLED' ? '#a82323' : '#196338',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {order.status}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn-primary"
                    style={{ padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Track Parcel & Details →
                  </Link>
                </div>
              </div>

              {/* Order Items Snippets */}
              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.items?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', background: '#f8f5ee', overflow: 'hidden', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: '#14291f', fontSize: '0.875rem', margin: '0 0 0.15rem' }}>{item.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#82948a', margin: 0 }}>Qty: {item.quantity} • Rs. {Number(item.price).toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
