import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div
      className="alert alert-danger"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        margin: '16px 0',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        <AlertCircle size={22} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>Error encountered</div>
          <div style={{ fontSize: '0.86rem', wordBreak: 'break-word' }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-mobile-full" onClick={onRetry} style={{ fontSize: '0.82rem' }}>
          <RotateCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
