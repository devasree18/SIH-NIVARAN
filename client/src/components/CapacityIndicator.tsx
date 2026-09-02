import React from 'react';

interface CapacityIndicatorProps {
  totalCapacity: number;
  reservedQuantity: number;
  unit?: string;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  totalCapacity,
  reservedQuantity,
  unit = 'Qtl',
}) => {
  const percentage = totalCapacity > 0 ? Math.min(100, Math.round((reservedQuantity / totalCapacity) * 100)) : 0;
  const available = Math.max(0, parseFloat((totalCapacity - reservedQuantity).toFixed(1)));

  let barColor = 'var(--color-primary-600)';
  if (percentage >= 90) barColor = 'var(--color-danger)';
  else if (percentage >= 70) barColor = 'var(--color-warning)';

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '6px',
        }}
      >
        <span>
          Available: <strong style={{ color: barColor }}>{available} {unit}</strong>
        </span>
        <span style={{ color: 'var(--color-text-subtle)' }}>
          {percentage}% Reserved ({reservedQuantity}/{totalCapacity} {unit})
        </span>
      </div>

      <div
        style={{
          height: '8px',
          width: '100%',
          backgroundColor: 'var(--color-bg-subtle)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: barColor,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};
