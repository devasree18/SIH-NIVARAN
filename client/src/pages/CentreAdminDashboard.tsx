import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  DollarSign,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CongestionIndicator } from '../components/CongestionIndicator';
import { CapacityIndicator } from '../components/CapacityIndicator';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { StatusBadge } from '../components/StatusBadge';

export const CentreAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [dashboard, setDashboard] = useState<any>(null);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delay Incident Announcement Modal
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('MACHINERY_FAILURE');
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [delayDescription, setDelayDescription] = useState('');
  const [submittingDelay, setSubmittingDelay] = useState(false);

  // Adjustment Decision Modal
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);
  const [adjustmentAction, setAdjustmentAction] = useState<'approve' | 'reject'>('approve');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [dashRes, adjRes] = await Promise.all([
        api.getAdminDashboard(user?.centreId || undefined),
        api.getPendingAdjustments(user?.centreId || undefined),
      ]);
      setDashboard(dashRes);
      setAdjustments(adjRes || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load centre admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAnnounceDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard?.centre?.id) return;

    setSubmittingDelay(true);
    try {
      const res = await api.recordDelay({
        centreId: dashboard.centre.id,
        reason: delayReason,
        description: delayDescription || 'Operational incident logged by Centre Manager',
        delayMinutes: Number(delayMinutes),
        authorizedAction: 'EXTEND_VALIDITY',
      });

      showToast(`Centre delay recorded. ${res.protectedTokensCount} active tokens protected!`, 'success');
      setIsDelayModalOpen(false);
      setDelayDescription('');
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record delay', 'error');
    } finally {
      setSubmittingDelay(false);
    }
  };

  const handleAdjustmentDecision = async () => {
    if (!selectedAdjustment) return;

    setSubmittingAdjustment(true);
    try {
      await api.decideAdjustment(selectedAdjustment.id, {
        approved: adjustmentAction === 'approve',
        reason: adjustmentReason || `Manager ${adjustmentAction}d quantity variation`,
      });

      showToast(`Quantity adjustment ${adjustmentAction}d successfully!`, 'success');
      setSelectedAdjustment(null);
      setAdjustmentReason('');
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Decision failed', 'error');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={55} />
      </div>
    );
  }

  const centre = dashboard?.centre;
  const metrics = dashboard?.metrics;
  const congestion = dashboard?.congestion;

  return (
    <div className="content-body">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1>Mandi Operations & Queue Control</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Centre: <strong>{centre?.name} ({centre?.code})</strong> • Status: <strong>{centre?.operationalStatus}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchAdminData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setIsDelayModalOpen(true)}
          >
            <ShieldAlert size={16} /> Announce Centre Delay (Token Protection)
          </button>
        </div>
      </div>

      {/* Real-time Congestion Banner */}
      {congestion && (
        <div style={{ marginBottom: '20px' }}>
          <CongestionIndicator congestion={congestion} />
        </div>
      )}

      {/* 4-Card Operational Summary */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="nivaran-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Scheduled Today
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '4px' }}>
            {metrics?.scheduledToday || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Checked In: {metrics?.checkedInCount || 0}
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Waiting in Queue
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '4px' }}>
            {metrics?.waitingCount || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Across {centre?.activeCounters} active counters
          </div>
        </div>

        <div className="nivaran-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Completed Procurements
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            {metrics?.completedToday || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            Total Qtl Today: {metrics?.procuredQuantityToday || 0} Qtl
          </div>
        </div>

        <div className="nivaran-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
            Daily Capacity Occupancy
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '4px' }}>
            {metrics?.occupancyPercent || 0}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
            {metrics?.totalReservedQuantity} / {metrics?.totalSlotCapacity} Qtl reserved
          </div>
        </div>
      </div>

      {/* Pending Quantity Adjustments for Manager Approval */}
      <div className="nivaran-card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Scale size={18} color="var(--color-primary-700)" />
            Pending Excess Quantity Approvals ({adjustments.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
            Manager authorization required for produce exceeding booked quota
          </span>
        </div>

        {adjustments.length > 0 ? (
          <div className="table-container">
            <table className="nivaran-table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Farmer</th>
                  <th>Booked Qty</th>
                  <th>Delivered Qty</th>
                  <th>Excess Requested</th>
                  <th>Reason / Cause</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td style={{ fontWeight: 700 }}>#{adj.tokenId}</td>
                    <td>{adj.booking?.farmer?.fullName}</td>
                    <td>{adj.originalTokenQuantity} Qtl</td>
                    <td style={{ fontWeight: 600 }}>{adj.verifiedQuantity} Qtl</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                      +{adj.additionalRequestedQuantity} Qtl
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>{adj.reason}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            setSelectedAdjustment(adj);
                            setAdjustmentAction('approve');
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            setSelectedAdjustment(adj);
                            setAdjustmentAction('reject');
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-subtle)', fontSize: '0.86rem' }}>
            No excess quantity requests pending review. All certified weights match booked allocations.
          </div>
        )}
      </div>

      {/* Centre Delay / Token Protection Modal */}
      {isDelayModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDelayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert color="var(--color-danger)" size={22} />
              Announce Centre Delay & Protect Farmer Tokens
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              When a mandi experiences machinery downtime, weather disruption, or grid congestion, recording a delay automatically extends all active farmer tokens so farmers are never penalized or expired.
            </p>

            <form onSubmit={handleAnnounceDelay}>
              <div className="form-group">
                <label className="form-label">Delay Cause</label>
                <select
                  className="form-select"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  required
                >
                  <option value="MACHINERY_FAILURE">Machinery Failure (Weighbridge/Conveyor)</option>
                  <option value="CONGESTION">Severe Queue Congestion</option>
                  <option value="WEATHER">Unseasonal Rain / Bad Weather</option>
                  <option value="SERVER_OUTAGE">Server / Network Disruption</option>
                  <option value="ADMINISTRATIVE_DELAY">Administrative / Inspector Delay</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Delay (Minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public Advisory Note</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={delayDescription}
                  onChange={(e) => setDelayDescription(e.target.value)}
                  placeholder="e.g. Weighbridge load-cell recalibration under way. Token validities shifted forward."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDelayModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingDelay}
                >
                  {submittingDelay ? 'Protecting Tokens...' : 'Broadcast Delay & Extend Validity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Confirmation Dialog */}
      {selectedAdjustment && (
        <ConfirmationDialog
          isOpen={true}
          title={`${adjustmentAction === 'approve' ? 'Approve' : 'Reject'} Quantity Adjustment`}
          message={`Are you sure you want to ${adjustmentAction} additional ${selectedAdjustment.additionalRequestedQuantity} Qtl for token #${selectedAdjustment.tokenId}?`}
          confirmText={adjustmentAction === 'approve' ? 'Approve Excess' : 'Reject Excess'}
          isDangerous={adjustmentAction === 'reject'}
          loading={submittingAdjustment}
          onConfirm={handleAdjustmentDecision}
          onCancel={() => setSelectedAdjustment(null)}
        />
      )}
    </div>
  );
};
