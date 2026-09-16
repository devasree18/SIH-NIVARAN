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
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.tokenNumber}
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.45rem)', fontWeight: 800, color: 'var(--color-primary-900)' }}>
            #{booking.tokenId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={booking.queueStatus} />
          {booking.tokenStatus === 'EXTENDED' && (
            <StatusBadge status="EXTENDED" />
          )}
        </div>
      </div>

      <div className="grid-3" style={{ margin: '16px 0' }}>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.queuePosition}
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '2px' }}>
            #{booking.queueNumber}
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.farmersAhead}
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '2px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Users size={20} color="var(--color-primary-600)" />
              {farmersAhead}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            {t.estimatedWaitTime}
          </div>
          <div style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: 'var(--color-warning)', marginTop: '2px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isCalled ? '#fee2e2' : 'var(--color-primary-50)',
          border: isCalled ? '1px solid #f87171' : '1px solid var(--color-primary-200)',
          marginBottom: '16px',
        }}
      >
        {isCalled ? (
          <AlertTriangle color="var(--color-danger)" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <CheckCircle color="var(--color-primary-600)" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isCalled ? '#991b1b' : 'var(--color-primary-800)' }}>
            {t.nextActionTitle}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px', wordBreak: 'break-word' }}>
            {nextAction}
          </div>
        </div>
      </div>

      {/* Check In Action if still scheduled */}
      {!isCheckedIn && onCheckIn && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-mobile-full"
            onClick={onCheckIn}
            disabled={checkingIn}
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            {checkingIn ? 'Recording Arrival...' : t.checkInAction}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
