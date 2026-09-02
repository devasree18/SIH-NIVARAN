import React from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from './StatusBadge';

interface NotificationListProps {
  onSelectAction?: (url: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ onSelectAction }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <div className="nivaran-card" style={{ padding: '16px' }}>
      <div className="card-header" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--color-primary-700)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications & Alerts</h3>
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
              fontSize: '0.78rem',
              color: 'var(--color-primary-700)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-subtle)', fontSize: '0.86rem' }}>
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
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle)',
                backgroundColor: n.isRead ? 'var(--color-bg-surface)' : 'var(--color-primary-50)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  {n.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                {n.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
