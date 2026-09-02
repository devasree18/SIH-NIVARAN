import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('APPROVED');
  const [pfmsRef, setPfmsRef] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchFinanceData = async () => {
    try {
      const [sumRes, payRes] = await Promise.all([
        api.getFinanceSummary(),
        api.getPayments({ status: statusFilter || undefined }),
      ]);
      setSummary(sumRes);
      setPayments(payRes || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch finance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [statusFilter]);

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setUpdating(true);
    try {
      await api.updatePaymentStatus(selectedPayment.paymentId, {
        status: newStatus,
        paymentReference: pfmsRef || `PFMS-NEFT-${Date.now().toString().slice(-6)}`,
      });

      showToast(`Payment #${selectedPayment.paymentId} marked as ${newStatus}!`, 'success');
      setSelectedPayment(null);
      await fetchFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Payment status update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={50} />
      </div>
    );
  }

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>PFMS Direct Benefit Transfer (DBT) Finance Portal</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Officer: <strong>{user?.fullName}</strong> • Treasury Clearing & Remittance Desk
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchFinanceData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-primary-700)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Total Procurement Value (INR)
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '4px' }}>
            ₹{(summary?.totalDisbursementValue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Total value of accepted farmer grain
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Settled via Direct Benefit Transfer
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            ₹{(summary?.settledValue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Settled Vouchers: {summary?.settledCount || 0}
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Pending Disbursement Pipeline
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>
            {summary?.pendingDisbursementCount || 0} vouchers
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Awaiting treasury clearing / approval
          </div>
        </div>
      </div>

      {/* Payment Vouchers Table */}
      <div className="nivaran-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="card-title">
              <DollarSign size={18} color="var(--color-primary-700)" />
              DBT Disbursement Queue
            </h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-medium)',
                fontSize: '0.82rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="INITIATED">INITIATED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PAID">PAID</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="table-container">
            <table className="nivaran-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Farmer Details</th>
                  <th>Masked Account</th>
                  <th>Payable Amount</th>
                  <th>Aging (Hours)</th>
                  <th>Status</th>
                  <th>PFMS Ref</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isDelayed = p.ageHours > 48 && p.status !== 'PAID';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.paymentId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.farmer?.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{p.farmer?.farmerId}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {p.farmer?.bankName} ({p.farmer?.accountNumberMasked})
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>
                        ₹{p.payableAmount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isDelayed ? 'var(--color-danger)' : 'var(--color-text-muted)',
                          }}
                        >
                          {p.ageHours || 0} hrs {isDelayed && '⚠️'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {p.paymentReference || '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            setSelectedPayment(p);
                            setNewStatus(p.status === 'INITIATED' ? 'APPROVED' : 'PAID');
                            setPfmsRef(p.paymentReference || `PFMS-NEFT-${Date.now().toString().slice(-6)}`);
                          }}
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-subtle)' }}>
            No disbursement vouchers found for the selected filter.
          </div>
        )}
      </div>

      {/* Payment Status Transition Modal */}
      {selectedPayment && (
        <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '14px' }}>
              Update DBT Remittance Status: #{selectedPayment.paymentId}
            </h3>

            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '12px', borderRadius: '6px', fontSize: '0.84rem', marginBottom: '16px' }}>
              Farmer: <strong>{selectedPayment.farmer?.fullName}</strong><br />
              Payable: <strong>₹{selectedPayment.payableAmount.toLocaleString('en-IN')}</strong><br />
              Bank Account: <strong>{selectedPayment.farmer?.bankName} ({selectedPayment.farmer?.accountNumberMasked})</strong>
            </div>

            <form onSubmit={handleUpdatePayment}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="PROCESSING">PROCESSING (Under Treasury Batch)</option>
                  <option value="APPROVED">APPROVED (Authorized for Clearing)</option>
                  <option value="PAID">PAID (Credited via Direct Benefit Transfer)</option>
                  <option value="ON_HOLD">ON_HOLD (Awaiting IFSC/Account Verification)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">PFMS / NEFT Bank Transaction Reference</label>
                <input
                  type="text"
                  className="form-input"
                  value={pfmsRef}
                  onChange={(e) => setPfmsRef(e.target.value)}
                  placeholder="e.g. PFMS-NEFT-2026-981240"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPayment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Recording...' : 'Confirm Remittance Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
