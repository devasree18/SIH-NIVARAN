import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface NotificationListProps {
  onSelectAction?: (url: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ onSelectAction }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <div style={{ width: '100%' }}>
      <div className="card-header" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Bell size={18} color="var(--color-primary-700)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Notifications & Alerts</h3>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-primary-700)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              minHeight: '34px',
            }}
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: 'min(60vh, 400px)',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            No recent notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markAsRead(n.id);
                if (n.actionUrl && onSelectAction) onSelectAction(n.actionUrl);
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: n.isRead ? 'var(--color-bg-surface)' : 'var(--color-primary-50)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  {n.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                {n.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
