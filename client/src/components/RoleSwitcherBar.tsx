import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RoleSwitcherBar: React.FC = () => {
  const { user, switchRole, loading } = useAuth();
  const { language, setLanguage } = useLanguage();

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
        padding: '8px clamp(12px, 3vw, 20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 100,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Shield size={16} color="#74c69d" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>Evaluation Toolbar:</span>
        <span style={{ opacity: 0.85, fontSize: '0.78rem' }}>Role Access Simulation</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
        {/* Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="eval-lang-select" style={{ opacity: 0.85, fontSize: '0.78rem' }}>
            Lang:
          </label>
          <select
            id="eval-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{
              background: '#2d6a4f',
              color: '#ffffff',
              border: '1px solid #52b788',
              borderRadius: '4px',
              padding: '5px 8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '34px',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="pb">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="eval-role-select" style={{ opacity: 0.85, fontSize: '0.78rem' }}>
            Role:
          </label>
          <select
            id="eval-role-select"
            value={user?.role || 'FARMER'}
            onChange={handleRoleChange}
            disabled={loading}
            style={{
              background: '#2d6a4f',
              color: '#ffffff',
              border: '1px solid #74c69d',
              borderRadius: '4px',
              padding: '5px 8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              minHeight: '34px',
              maxWidth: '210px',
            }}
          >
            {roles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.icon} {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
