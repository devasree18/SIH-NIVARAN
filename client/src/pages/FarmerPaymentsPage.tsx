import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const FarmerPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { t } = useLanguage();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.getPayments({ farmerId: user?.farmerId });
        setPayments(res || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch payment records', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={3} height={50} />
      </div>
    );
  }

  const totalDisbursed = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.payableAmount, 0);

  const pendingDisbursement = payments
    .filter((p) => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.payableAmount, 0);

  return (
    <div className="content-body">
      <div style={{ marginBottom: '20px' }}>
        <h1>{t.myPayments}</h1>
        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.9rem' }}>
          Real-time Direct Benefit Transfer (DBT) remittance tracking via Public Financial Management System (PFMS).
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Settled DBT Remittances
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
            Directly credited to verified bank account
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Pending Treasury Clearing
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>
            ₹{pendingDisbursement.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
            Scheduled within 48 hours of procurement
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-primary-700)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Registered Bank Profile
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-900)', marginTop: '4px' }}>
            {user?.farmer?.bankName || 'State Bank of India'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            A/C: {user?.farmer?.accountNumberMasked || 'XXXXXXXX4821'} • IFSC: {user?.farmer?.ifscCode || 'SBIN0001234'}
          </div>
        </div>
      </div>

      {/* Payment List Table */}
      <div className="nivaran-card">
        <div className="card-header">
          <h3 className="card-title">
            <CreditCard size={18} color="var(--color-primary-700)" />
            DBT Transaction History & Remittance Vouchers
          </h3>
        </div>

        {payments.length > 0 ? (
          <div className="table-container">
            <table className="nivaran-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Procurement ID</th>
                  <th>Crop & Qty</th>
                  <th>Amount (INR)</th>
                  <th>PFMS Reference</th>
                  <th>Expected Clearing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.paymentId}</td>
                    <td>{p.procurementId}</td>
                    <td>{p.procurement?.crop} ({p.procurement?.finalProcuredQuantity} Qtl)</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>
                      ₹{p.payableAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>
                      {p.paymentReference || 'Pending Assignment'}
                    </td>
                    <td>{new Date(p.expectedProcessingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-subtle)' }}>
            No payment records found. Payments are automatically initiated upon completed weighment and procurement confirmation.
          </div>
        )}
      </div>
    </div>
  );
};
