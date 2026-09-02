import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { NotificationList } from './components/NotificationList';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { BookSlotPage } from './pages/BookSlotPage';
import { FarmerPaymentsPage } from './pages/FarmerPaymentsPage';
import { CentreAdminDashboard } from './pages/CentreAdminDashboard';
import { QueueOperatorPage } from './pages/QueueOperatorPage';
import { QualityOfficerPage } from './pages/QualityOfficerPage';
import { WeighmentPage } from './pages/WeighmentPage';
import { FinancePage } from './pages/FinancePage';
import { PublicQueueBoardPage } from './pages/PublicQueueBoardPage';
import { CultivationCostsPage } from './pages/CultivationCostsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('farmer-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  // Sync route whenever user role changes
  useEffect(() => {
    if (!user) return;
    switch (user.role) {
      case 'FARMER':
        setCurrentRoute('farmer-dashboard');
        break;
      case 'CENTRE_OPERATOR':
        setCurrentRoute('queue-operator');
        break;
      case 'CENTRE_MANAGER':
        setCurrentRoute('centre-admin');
        break;
      case 'QUALITY_OFFICER':
        setCurrentRoute('quality-officer');
        break;
      case 'WEIGHMENT_OPERATOR':
        setCurrentRoute('weighment-desk');
        break;
      case 'FINANCE_OFFICER':
        setCurrentRoute('finance-desk');
        break;
      default:
        setCurrentRoute('farmer-dashboard');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-base)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-800)', marginBottom: '8px' }}>
            NIVARAN
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)' }}>
            Connecting to Agricultural Procurement Management Server...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={() => setCurrentRoute('farmer-dashboard')} />;
  }

  const renderRoute = () => {
    switch (currentRoute) {
      case 'farmer-dashboard':
        return <FarmerDashboard onNavigate={(r) => setCurrentRoute(r)} />;
      case 'book-slot':
        return <BookSlotPage onNavigate={(r) => setCurrentRoute(r)} />;
      case 'farmer-payments':
        return <FarmerPaymentsPage />;
      case 'centre-admin':
        return <CentreAdminDashboard />;
      case 'queue-operator':
        return <QueueOperatorPage />;
      case 'quality-officer':
        return <QualityOfficerPage />;
      case 'weighment-desk':
        return <WeighmentPage />;
      case 'finance-desk':
        return <FinancePage />;
      case 'mandi-board':
        return <PublicQueueBoardPage />;
      case 'cultivation-costs':
        return <CultivationCostsPage />;
      case 'audit-logs':
        return <AuditLogPage />;
      default:
        return <FarmerDashboard onNavigate={(r) => setCurrentRoute(r)} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Role Switcher for Evaluators */}
        <RoleSwitcherBar />

        {/* Navigation Header */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        {/* Dynamic Route View */}
        {renderRoute()}
      </div>

      {/* Notifications Drawer Modal */}
      {notificationsOpen && (
        <div className="modal-overlay" onClick={() => setNotificationsOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <NotificationList
              onSelectAction={(url) => {
                setNotificationsOpen(false);
                if (url.includes('token')) setCurrentRoute('farmer-dashboard');
                if (url.includes('payment')) setCurrentRoute('farmer-payments');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
