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
        padding: '16px',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={22} />
        <div>
          <div style={{ fontWeight: 700 }}>Error encountered</div>
          <div style={{ fontSize: '0.88rem' }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ fontSize: '0.82rem' }}>
          <RotateCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
