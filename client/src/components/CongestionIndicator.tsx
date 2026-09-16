import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CongestionIndicatorProps {
  congestion: any;
  showDetails?: boolean;
}

export const CongestionIndicator: React.FC<CongestionIndicatorProps> = ({
  congestion,
  showDetails = true,
}) => {
  const { t } = useLanguage();

  if (!congestion) return null;

  const level = congestion.congestionLevel || 'LOW';
  const isCritical = level === 'CRITICAL';
  const isHigh = level === 'HIGH';
  const isModerate = level === 'MODERATE';

  const color = isCritical
    ? 'var(--color-danger)'
    : isHigh
    ? 'var(--color-warning)'
    : isModerate
    ? '#b45309'
    : 'var(--color-success)';

  const bgColor = isCritical
    ? 'var(--color-danger-bg)'
    : isHigh
    ? 'var(--color-warning-bg)'
    : isModerate
    ? '#fef3c7'
    : 'var(--color-success-bg)';

  const label =
    level === 'LOW'
      ? t.congestionLow
      : level === 'MODERATE'
      ? t.congestionModerate
      : level === 'HIGH'
      ? t.congestionHigh
      : t.congestionCritical;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: bgColor,
        border: `1px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCritical || isHigh ? (
            <ShieldAlert size={20} color={color} style={{ flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={20} color={color} style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color }}>
            Mandi Congestion: {level}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
          ~{congestion.estimatedWaitMinutes} min wait
        </div>
      </div>

      <div style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', wordBreak: 'break-word' }}>
        {label}
      </div>

      {(isCritical || isHigh) && (
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--color-primary-900)',
            marginTop: '4px',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: '4px',
            wordBreak: 'break-word',
          }}
        >
          {t.delayProtectionNotice}
        </div>
      )}

      {showDetails && congestion.contributingFactors && congestion.contributingFactors.length > 0 && (
        <div style={{ marginTop: '4px', fontSize: '0.76rem', color: 'var(--color-text-muted)', wordBreak: 'break-word' }}>
          <span style={{ fontWeight: 600 }}>Active Factors: </span>
          {congestion.contributingFactors.join(' • ')}
        </div>
      )}
    </div>
  );
};
