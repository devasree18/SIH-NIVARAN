import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, registerFarmer } = useAuth();
  const { showToast } = useNotification();
  const { t } = useLanguage();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('farmer_ramesh');
  const [password, setPassword] = useState('password123');

  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [district, setDistrict] = useState('Karnal');
  const [village, setVillage] = useState('Taraori');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [acreage, setAcreage] = useState<number>(5.0);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await registerFarmer({
          username,
          password,
          fullName,
          mobileNumber,
          district,
          village,
          address: address || village,
          bankName,
          accountNumber,
          ifscCode,
          landDetails: {
            acreage: Number(acreage),
            surveyNumber: 'SY-2026',
            irrigationType: 'Tubewell',
          },
        });
        showToast('Registration successful! Logged in.', 'success');
      } else {
        await login({ username, password });
        showToast('Login successful!', 'success');
      }
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="nivaran-card"
        style={{
          maxWidth: isRegister ? '680px' : '440px',
          width: '100%',
          borderTop: '6px solid var(--color-primary-800)',
          padding: '32px 28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-800)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: '10px',
            }}
          >
            नि
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-900)' }}>
            {isRegister ? 'New Farmer Portal Registration' : 'Sign in to NIVARAN'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
            Smart India Hackathon 2026 • Problem Statement 26032
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={isRegister ? 'grid-2' : ''}>
            <div>
              <div className="form-group">
                <label className="form-label">Username / Mobile</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isRegister && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="10-digit mobile"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            {isRegister && (
              <div>
                <div className="form-group">
                  <label className="form-label">District & Village</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Land Acreage</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={acreage}
                    onChange={(e) => setAcreage(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name & Account Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    style={{ marginBottom: '6px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '16px', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Register Farmer Profile' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ fontSize: '0.84rem', color: 'var(--color-primary-700)', fontWeight: 600 }}
          >
            {isRegister
              ? 'Already registered? Sign in with existing credentials'
              : 'New Farmer? Register your profile for Mandi appointments'}
          </button>
        </div>
      </div>
    </div>
  );
};
