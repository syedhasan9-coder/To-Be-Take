'use client';

import React from 'react';

interface TimelineStep {
  key: string;
  label: string;
  desc?: string;
  completed: boolean;
  active: boolean;
  timestamp?: string | null;
}

interface OrderTrackingTimelineProps {
  timeline: TimelineStep[];
  currentStatus: string;
  carrier?: string;
  trackingNumber?: string;
}

export function OrderTrackingTimeline({
  timeline,
  currentStatus,
  carrier,
  trackingNumber,
}: OrderTrackingTimelineProps): React.ReactElement {
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="tracking-timeline-card cancelled-box">
        <div className="cancelled-header">
          <span className="status-icon">⚠️</span>
          <div>
            <h4>Order Cancelled</h4>
            <p>This order has been cancelled and inventory released.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-timeline-card">
      <div className="tracking-meta-header">
        <div className="courier-badge">
          <span className="courier-icon">🚚</span>
          <div>
            <p className="courier-name">{carrier || 'TCS Express Pakistan'}</p>
            {trackingNumber && <p className="tracking-no">Consignment No: <strong>{trackingNumber}</strong></p>}
          </div>
        </div>
        <div className="current-status-tag">
          Status: <span>{currentStatus.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className="timeline-track">
        {timeline.map((step, idx) => {
          return (
            <div
              key={step.key || idx}
              className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <div className="step-indicator">
                <div className="step-bullet">
                  {step.completed ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="check-svg">
                      <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {idx < timeline.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <p className="step-title">{step.label}</p>
                {step.desc && <p className="step-desc">{step.desc}</p>}
                {step.timestamp && (
                  <p className="step-time">
                    {new Date(step.timestamp).toLocaleDateString('en-PK', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
