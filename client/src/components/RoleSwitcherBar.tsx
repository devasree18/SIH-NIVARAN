import React from 'react';
import { UserCheck, Shield, ChevronDown } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RoleSwitcherBar: React.FC = () => {
  const { user, switchRole, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'FARMER', label: '1. Farmer (किसान)', icon: '🌾' },
    { role: 'CENTRE_OPERATOR', label: '2. Queue Operator', icon: '🎫' },
    { role: 'CENTRE_MANAGER', label: '3. Mandi Manager (Admin)', icon: '🏛️' },
    { role: 'QUALITY_OFFICER', label: '4. Quality Assay Officer', icon: '🔬' },
    { role: 'WEIGHMENT_OPERATOR', label: '5. Weighment Operator', icon: '⚖️' },
    { role: 'FINANCE_OFFICER', label: '6. Finance / DBT Officer', icon: '💳' },
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  return (
    <div
      className="role-switcher-bar"
      style={{
        backgroundColor: '#1b4332',
        color: '#ffffff',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={16} color="#74c69d" />
        <span style={{ fontWeight: 600 }}>SIH 2026 Evaluation Toolbar:</span>
        <span style={{ opacity: 0.85 }}>Role-Based Access Simulation</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.85 }}>Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{
              background: '#2d6a4f',
              color: '#ffffff',
              border: '1px solid #52b788',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="pb">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.85 }}>Active Role:</span>
          <select
            value={user?.role || 'FARMER'}
            onChange={handleRoleChange}
            disabled={loading}
            style={{
              background: '#2d6a4f',
              color: '#ffffff',
              border: '1px solid #74c69d',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            {roles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.icon} {r.label}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div style={{ opacity: 0.9 }}>
            Logged in as: <strong>{user.fullName}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
