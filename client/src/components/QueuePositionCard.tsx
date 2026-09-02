import React from 'react';
import { Clock, Users, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useLanguage } from '../context/LanguageContext';

interface QueuePositionCardProps {
  booking: any;
  farmersAhead: number;
  estimatedWaitMinutes: number;
  nextAction: string;
  onCheckIn?: () => void;
  checkingIn?: boolean;
}

export const QueuePositionCard: React.FC<QueuePositionCardProps> = ({
  booking,
  farmersAhead,
  estimatedWaitMinutes,
  nextAction,
  onCheckIn,
  checkingIn = false,
}) => {
  const { t } = useLanguage();

  if (!booking) return null;

  const isCheckedIn = booking.queueStatus !== 'SCHEDULED' && booking.queueStatus !== 'APPROACHING';
  const isCalled = booking.queueStatus === 'CALLED';

  return (
    <div
      className="nivaran-card"
      style={{
        borderLeft: isCalled ? '6px solid var(--color-danger)' : '6px solid var(--color-primary-600)',
        background: isCalled ? '#fff7ed' : 'var(--color-bg-surface)',
      }}
    >
      <div className="card-header">
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.tokenNumber}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
            #{booking.tokenId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={booking.queueStatus} />
          {booking.tokenStatus === 'EXTENDED' && (
            <StatusBadge status="EXTENDED" />
          )}
        </div>
      </div>

      <div className="grid-3" style={{ margin: '16px 0' }}>
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.queuePosition}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-800)' }}>
            #{booking.queueNumber}
          </div>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.farmersAhead}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={20} color="var(--color-primary-600)" />
              {farmersAhead}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.estimatedWaitTime}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={20} />
              {estimatedWaitMinutes}m
            </span>
          </div>
        </div>
      </div>

      {/* Next Action Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isCalled ? '#fee2e2' : 'var(--color-primary-50)',
          border: isCalled ? '1px solid #f87171' : '1px solid var(--color-primary-200)',
          marginBottom: '16px',
        }}
      >
        {isCalled ? (
          <AlertTriangle color="var(--color-danger)" size={24} />
        ) : (
          <CheckCircle color="var(--color-primary-600)" size={24} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isCalled ? '#991b1b' : 'var(--color-primary-800)' }}>
            {t.nextActionTitle}
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            {nextAction}
          </div>
        </div>
      </div>

      {/* Check In Action if still scheduled */}
      {!isCheckedIn && onCheckIn && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={onCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? 'Recording Arrival...' : t.checkInAction}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
