import React, { useEffect } from 'react';
import {
  Home,
  CalendarPlus,
  Ticket,
  CreditCard,
  Building2,
  ListOrdered,
  FlaskConical,
  Scale,
  DollarSign,
  Tv,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const role = user?.role || 'FARMER';

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    // Farmer Items
    {
      id: 'farmer-dashboard',
      label: t.farmerDashboard,
      icon: Home,
      roles: ['FARMER', 'CENTRE_MANAGER'],
    },
    {
      id: 'book-slot',
      label: t.bookSlot,
      icon: CalendarPlus,
      roles: ['FARMER', 'CENTRE_MANAGER', 'CENTRE_OPERATOR'],
    },
    {
      id: 'farmer-payments',
      label: t.myPayments,
      icon: CreditCard,
      roles: ['FARMER', 'FINANCE_OFFICER', 'CENTRE_MANAGER'],
    },

    // Administrative & Centre Operations
    {
      id: 'centre-admin',
      label: t.centreAdmin,
      icon: Building2,
      roles: ['CENTRE_MANAGER', 'CENTRE_OPERATOR'],
    },
    {
      id: 'queue-operator',
      label: t.queueOperator,
      icon: ListOrdered,
      roles: ['CENTRE_OPERATOR', 'CENTRE_MANAGER'],
    },
    {
      id: 'quality-officer',
      label: t.qualityOfficer,
      icon: FlaskConical,
      roles: ['QUALITY_OFFICER', 'CENTRE_MANAGER'],
    },
    {
      id: 'weighment-desk',
      label: t.weighmentDesk,
      icon: Scale,
      roles: ['WEIGHMENT_OPERATOR', 'CENTRE_MANAGER'],
    },
    {
      id: 'finance-desk',
      label: t.financeDesk,
      icon: DollarSign,
      roles: ['FINANCE_OFFICER', 'CENTRE_MANAGER'],
    },

    // Public / Analytics
    {
      id: 'mandi-board',
      label: t.mandiBoard,
      icon: Tv,
      roles: ['ALL'],
    },
    {
      id: 'cultivation-costs',
      label: t.cultivationCosts,
      icon: TrendingUp,
      roles: ['ALL'],
    },
    {
      id: 'audit-logs',
      label: t.auditLogs,
      icon: FileText,
      roles: ['CENTRE_MANAGER'],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('ALL') || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop mobile-only"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'is-open' : ''}`}
        aria-label="Primary site navigation"
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              नि
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-900)' }}>
                NIVARAN
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)', lineHeight: 1 }}>
                Mandi Procurement Platform
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mobile-only"
            aria-label="Close navigation menu"
            style={{
              padding: '8px',
              color: 'var(--color-text-subtle)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '16px 10px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-text-subtle)',
              textTransform: 'uppercase',
              padding: '6px 12px',
              letterSpacing: '0.05em',
            }}
          >
            Navigation
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary-800)' : 'var(--color-text-main)',
                  backgroundColor: isActive ? 'var(--color-primary-100)' : 'transparent',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Icon
                  size={19}
                  color={isActive ? 'var(--color-primary-800)' : 'var(--color-primary-600)'}
                />
                <span style={{ flex: 1, wordBreak: 'break-word' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Government Service Stamp */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: '0.72rem',
            color: 'var(--color-text-subtle)',
            lineHeight: 1.4,
          }}
        >
          <strong>Ministry of Agriculture & Farmers Welfare</strong><br />
          SIH 2026 Problem Statement 26032
        </div>
      </aside>
    </>
  );
};
