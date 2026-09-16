import React from 'react';
import { Scale } from 'lucide-react';

interface QuantityComparisonPanelProps {
  bookedQuantity: number;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  acceptedQuantity?: number;
  excessQuantity?: number;
  adjustmentStatus?: string;
}

export const QuantityComparisonPanel: React.FC<QuantityComparisonPanelProps> = ({
  bookedQuantity,
  grossWeight,
  tareWeight,
  netWeight,
  acceptedQuantity,
  excessQuantity,
  adjustmentStatus,
}) => {
  const hasExcess = excessQuantity && excessQuantity > 0;

  return (
    <div className="nivaran-card" style={{ marginBottom: '16px' }}>
      <div className="card-header">
        <h3 className="card-title">
          <Scale size={18} color="var(--color-primary-700)" />
          Certified Weight & Quantity Breakdown
        </h3>
        {adjustmentStatus && (
          <span
            className={`badge ${
              adjustmentStatus === 'APPROVED'
                ? 'badge-success'
                : adjustmentStatus === 'PENDING'
                ? 'badge-warning'
                : 'badge-danger'
            }`}
          >
            Excess: {adjustmentStatus}
          </span>
        )}
      </div>

      <div className="grid-4">
        <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            Booked Allocation
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
            {bookedQuantity} <span style={{ fontSize: '0.82rem' }}>Qtl</span>
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            Gross Weight
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
            {grossWeight !== undefined ? `${grossWeight} Qtl` : '—'}
          </div>
          {tareWeight !== undefined && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
              Tare: {tareWeight} Qtl
            </div>
          )}
        </div>

        <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
            Delivered Net Produce
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: hasExcess ? 'var(--color-warning)' : 'var(--color-text-main)', marginTop: '2px' }}>
            {netWeight !== undefined ? `${netWeight} Qtl` : '—'}
          </div>
          {hasExcess && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: '2px' }}>
              +{excessQuantity} Qtl excess
            </div>
          )}
        </div>

        <div style={{ padding: '12px', background: 'var(--color-primary-50)', borderRadius: '6px', border: '1px solid var(--color-primary-200)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-800)', fontWeight: 600 }}>
            Final Accepted Quantity
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '2px' }}>
            {acceptedQuantity !== undefined ? `${acceptedQuantity} Qtl` : 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
};
