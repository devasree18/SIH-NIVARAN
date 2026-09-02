import React, { useState, useEffect } from 'react';
import { FlaskConical, CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const QualityOfficerPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [pendingData, setPendingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // Assay input form state
  const [moisture, setMoisture] = useState<number>(11.2);
  const [foreignMatter, setForeignMatter] = useState<number>(0.4);
  const [damagedGrains, setDamagedGrains] = useState<number>(1.8);
  const [admixture, setAdmixture] = useState<number>(0.2);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await api.getPendingQualityTests(user?.centreId || undefined);
      setPendingData(res);
      if (res?.pending && res.pending.length > 0 && !selectedToken) {
        setSelectedToken(res.pending[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch pending assay tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user]);

  const handleSubmitAssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) return;

    setSubmitting(true);
    try {
      const res = await api.recordQualityAssay({
        tokenId: selectedToken.tokenId,
        moisturePercentage: Number(moisture),
        foreignMatterPercentage: Number(foreignMatter),
        damagedGrainsPercentage: Number(damagedGrains),
        admixturePercentage: Number(admixture),
        notes,
      });

      showToast(`Assay recorded! Result: ${res.grade} (${res.qualityStatus})`, res.qualityStatus === 'PASSED' ? 'success' : 'warning');
      setSelectedToken(null);
      await fetchPending();
    } catch (err: any) {
      showToast(err.message || 'Assay recording failed', 'error');
    } finally {
      setSubmitting(false);
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
          <h1>Quality & Assay Certification Laboratory</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Officer: <strong>{user?.fullName}</strong> • Digital Mandi Grain Testing Terminal
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchPending}>
          <RefreshCw size={16} /> Refresh Samples
        </button>
      </div>

      <div className="grid-2">
        {/* Left: Pending Samples Queue */}
        <div className="nivaran-card">
          <div className="card-header">
            <h3 className="card-title">
              <FlaskConical size={18} color="var(--color-primary-700)" />
              Samples Awaiting Assay ({pendingData?.pending?.length || 0})
            </h3>
          </div>

          {pendingData?.pending && pendingData.pending.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingData.pending.map((item: any) => {
                const isSelected = selectedToken?.tokenId === item.tokenId;
                return (
                  <div
                    key={item.tokenId}
                    onClick={() => setSelectedToken(item)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected
                        ? '2px solid var(--color-primary-700)'
                        : '1px solid var(--color-border-subtle)',
                      backgroundColor: isSelected
                        ? 'var(--color-primary-50)'
                        : 'var(--color-bg-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                        Token #{item.tokenId}
                      </span>
                      <span className="badge badge-info">Queue #{item.queueNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-main)' }}>
                      Farmer: <strong>{item.farmer?.fullName}</strong> • Crop: <strong>{item.crop} ({item.allocatedQuantity} Qtl)</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-subtle)' }}>
              No pending grain samples awaiting quality assay.
            </div>
          )}
        </div>

        {/* Right: Assay Entry Form */}
        <div className="nivaran-card">
          <div className="card-header">
            <h3 className="card-title">
              Record Certified Assay Parameters
            </h3>
            {selectedToken && (
              <span style={{ fontWeight: 700, color: 'var(--color-primary-800)' }}>
                Token #{selectedToken.tokenId}
              </span>
            )}
          </div>

          {selectedToken ? (
            <form onSubmit={handleSubmitAssay}>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.84rem' }}>
                Testing <strong>{selectedToken.crop}</strong> produce for farmer <strong>{selectedToken.farmer?.fullName}</strong>.
                National MSP tolerances: Moisture &le; 12.0%, Foreign Matter &le; 0.75%, Damaged &le; 4.0%.
              </div>

              <div className="form-group">
                <label className="form-label">Moisture Content (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  className="form-input"
                  value={moisture}
                  onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                  required
                />
                <div className="form-hint">Must be &le; 12.0% for certified Wheat (Grade A standard &le; 11.0%)</div>
              </div>

              <div className="form-group">
                <label className="form-label">Foreign Matter / Dust (%)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="20"
                  className="form-input"
                  value={foreignMatter}
                  onChange={(e) => setForeignMatter(parseFloat(e.target.value) || 0)}
                  required
                />
                <div className="form-hint">Permissible maximum threshold: 0.75%</div>
              </div>

              <div className="form-group">
                <label className="form-label">Damaged / Shriveled Grains (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  className="form-input"
                  value={damagedGrains}
                  onChange={(e) => setDamagedGrains(parseFloat(e.target.value) || 0)}
                  required
                />
                <div className="form-hint">Permissible maximum threshold: 4.0%</div>
              </div>

              <div className="form-group">
                <label className="form-label">Assay Laboratory Notes & Observations</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Clean golden grains, optimal luster, verified moisture with digital meter."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ padding: '10px 20px', fontWeight: 700 }}
                >
                  {submitting ? 'Certifying Assay...' : 'Submit Certified Assay Decision'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-subtle)' }}>
              Select a sample from the left queue to begin quality inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
