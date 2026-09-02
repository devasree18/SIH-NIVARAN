import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'token' | 'queue' | 'quality' | 'payment' | 'congestion';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'queue' }) => {
  const normalized = (status || '').toUpperCase();

  let badgeClass = 'badge-neutral';
  let label = status;

  switch (normalized) {
    // Success / Completed / Passed
    case 'COMPLETED':
    case 'PAID':
    case 'PASSED':
    case 'APPROVED':
    case 'GRADE_A':
    case 'LOW':
      badgeClass = 'badge-success';
      break;

    // Attention / Warning / In-Progress
    case 'WAITING':
    case 'CHECKED_IN':
    case 'PROCESSING':
    case 'INITIATED':
    case 'EXTENDED':
    case 'MODERATE':
    case 'GRADE_B':
      badgeClass = 'badge-warning';
      break;

    // High / Urgent / Delayed
    case 'CALLED':
    case 'HIGH':
    case 'DELAYED':
    case 'CRITICAL':
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
      badgeClass = 'badge-danger';
      break;

    // Informational / Scheduled
    case 'SCHEDULED':
    case 'ACTIVE':
    case 'APPROACHING':
    case 'GRADE_C':
      badgeClass = 'badge-info';
      break;

    default:
      badgeClass = 'badge-neutral';
  }

  return <span className={`badge ${badgeClass}`}>{label.replace(/_/g, ' ')}</span>;
};
