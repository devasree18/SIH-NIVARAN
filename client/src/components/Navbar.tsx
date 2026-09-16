import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenNotifications }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '8px',
            borderRadius: '6px',
            color: 'var(--color-text-main)',
            minWidth: '40px',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Toggle navigation sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-800)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              flexShrink: 0,
            }}
          >
            नि
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                color: 'var(--color-primary-900)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t.appName}
            </div>
            <div
              className="desktop-only"
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-text-subtle)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t.appSubtitle}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            padding: '8px',
            minWidth: '40px',
            minHeight: '40px',
            borderRadius: '50%',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={`View notifications, ${unreadCount} unread`}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Pill */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              minHeight: '38px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-subtle)',
              maxWidth: '180px',
            }}
          >
            <User size={16} color="var(--color-primary-700)" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.fullName}
            </span>
            <button
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              style={{
                color: 'var(--color-text-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                minWidth: '28px',
                minHeight: '28px',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
