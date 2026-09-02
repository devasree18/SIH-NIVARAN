import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div
      className="nivaran-card"
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <div style={{ color: 'var(--color-primary-600)', opacity: 0.8 }}>
        {icon || <Inbox size={48} />}
      </div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-900)' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--color-text-subtle)', maxWidth: '420px', fontSize: '0.9rem' }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: '8px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
