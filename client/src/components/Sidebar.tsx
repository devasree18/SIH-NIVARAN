import React from 'react';
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
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 95,
          }}
        />
      )}

      <aside
        className="app-sidebar"
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--color-border-subtle)',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 96,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-primary-800)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              नि
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-900)' }}>
              NIVARAN
            </span>
          </div>

          <button
            onClick={onClose}
            className="mobile-only"
            style={{ padding: '6px', color: 'var(--color-text-subtle)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', padding: '6px 12px', letterSpacing: '0.05em' }}>
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary-800)' : 'var(--color-text-main)',
                  backgroundColor: isActive ? 'var(--color-primary-100)' : 'transparent',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Icon
                  size={18}
                  color={isActive ? 'var(--color-primary-800)' : 'var(--color-primary-600)'}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Government Service Stamp */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: '0.74rem',
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
