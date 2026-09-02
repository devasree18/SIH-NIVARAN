import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  time?: string;
  details?: string;
}

interface ProcurementTimelineProps {
  booking: any;
}

export const ProcurementTimeline: React.FC<ProcurementTimelineProps> = ({ booking }) => {
  if (!booking) return null;

  const queueStatus = booking.queueStatus || 'SCHEDULED';
  const qualityStatus = booking.qualityAssay?.qualityStatus;
  const weighmentDone = !!booking.weighment;
  const procurementDone = !!booking.procurementRecord;
  const paymentStatus = booking.procurementRecord?.payment?.status;

  const steps: TimelineStep[] = [
    {
      key: 'booking',
      label: 'Slot Booked',
      status: 'completed',
      time: new Date(booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      details: `${booking.allocatedQuantity} Qtl ${booking.crop}`,
    },
    {
      key: 'checkin',
      label: 'Mandi Arrival',
      status:
        queueStatus !== 'SCHEDULED' && queueStatus !== 'APPROACHING'
          ? 'completed'
          : 'current',
      time: booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      details: booking.checkInTime ? 'Checked In' : 'Awaiting Arrival',
    },
    {
      key: 'quality',
      label: 'Quality Assay',
      status:
        qualityStatus === 'PASSED'
          ? 'completed'
          : qualityStatus === 'FAILED'
          ? 'failed'
          : queueStatus === 'CALLED' || queueStatus === 'PROCESSING'
          ? 'current'
          : 'pending',
      details: booking.qualityAssay
        ? `${booking.qualityAssay.grade} (${booking.qualityAssay.qualityStatus})`
        : 'Inspection Pending',
    },
    {
      key: 'weighment',
      label: 'Weighment',
      status:
        weighmentDone
          ? 'completed'
          : qualityStatus === 'PASSED'
          ? 'current'
          : 'pending',
      details: booking.weighment
        ? `Net: ${booking.weighment.netWeight} Qtl`
        : 'Weighbridge Queue',
    },
    {
      key: 'procurement',
      label: 'Procurement Done',
      status: procurementDone ? 'completed' : 'pending',
      details: booking.procurementRecord
        ? `Accepted: ${booking.procurementRecord.acceptedQuantity} Qtl`
        : 'Confirmation Pending',
    },
    {
      key: 'payment',
      label: 'DBT Payment',
      status:
        paymentStatus === 'PAID'
          ? 'completed'
          : paymentStatus === 'INITIATED' || paymentStatus === 'PROCESSING' || paymentStatus === 'APPROVED'
          ? 'current'
          : 'pending',
      details: booking.procurementRecord?.payment
        ? `₹${booking.procurementRecord.payment.payableAmount.toLocaleString('en-IN')} (${booking.procurementRecord.payment.status})`
        : 'Direct Benefit Transfer',
    },
  ];

  return (
    <div className="nivaran-card" style={{ marginTop: '20px' }}>
      <div className="card-header">
        <h3 className="card-title">Procurement Progress Tracker</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
          Token #{booking.tokenId}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: '8px',
          position: 'relative',
          padding: '16px 0',
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isFailed = step.status === 'failed';

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Node Icon */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? 'var(--color-primary-700)'
                    : isCurrent
                    ? 'var(--color-warning)'
                    : isFailed
                    ? 'var(--color-danger)'
                    : 'var(--color-border-subtle)',
                  color: isCompleted || isCurrent || isFailed ? '#ffffff' : 'var(--color-text-subtle)',
                  zIndex: 2,
                  boxShadow: isCurrent ? '0 0 0 4px var(--color-warning-bg)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : isCurrent ? (
                  <Clock size={18} />
                ) : isFailed ? (
                  <AlertCircle size={18} />
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '0.82rem',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent
                    ? 'var(--color-warning)'
                    : isCompleted
                    ? 'var(--color-primary-900)'
                    : 'var(--color-text-subtle)',
                }}
              >
                {step.label}
              </div>

              {/* Detail */}
              {step.details && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-text-subtle)',
                    marginTop: '2px',
                  }}
                >
                  {step.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
