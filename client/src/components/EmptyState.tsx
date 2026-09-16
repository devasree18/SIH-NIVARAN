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
        padding: 'clamp(28px, 6vw, 48px) 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
      }}
    >
      <div style={{ color: 'var(--color-primary-600)', opacity: 0.85 }}>
        {icon || <Inbox size={42} />}
      </div>
      <h3 style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: 'var(--color-primary-900)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ color: 'var(--color-text-subtle)', maxWidth: '420px', fontSize: '0.88rem' }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button className="btn btn-primary btn-mobile-full" onClick={onAction} style={{ marginTop: '8px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
