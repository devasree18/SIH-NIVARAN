import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const WeighmentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [grossWeight, setGrossWeight] = useState<number>(65.0);
  const [tareWeight, setTareWeight] = useState<number>(25.0);
  const [submitting, setSubmitting] = useState(false);

  const fetchAwaiting = async () => {
    try {
      const res = await api.getAwaitingWeighment(user?.centreId || undefined);
      setData(res);
      if (res?.awaiting && res.awaiting.length > 0 && !selectedBooking) {
        setSelectedBooking(res.awaiting[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch weighbridge records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwaiting();
  }, [user]);

  const netWeight = parseFloat((Math.max(0, grossWeight - tareWeight)).toFixed(2));
  const allocated = selectedBooking?.allocatedQuantity || 0;
  const excess = netWeight > allocated ? parseFloat((netWeight - allocated).toFixed(2)) : 0;

  const handleSubmitWeighment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (grossWeight <= tareWeight) {
      showToast('Gross weight must be strictly greater than vehicle tare weight', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.recordWeighment({
        tokenId: selectedBooking.tokenId,
        grossWeight: Number(grossWeight),
        tareWeight: Number(tareWeight),
      });

      if (res.adjustmentRequest) {
        showToast(`Weighment logged (Net: ${res.weighment.netWeight} Qtl). Excess of ${res.adjustmentRequest.additionalRequestedQuantity} Qtl forwarded to Manager.`, 'warning');
      } else {
        showToast(`Certified Weighment logged (Net: ${res.weighment.netWeight} Qtl). Procurement finalized!`, 'success');
      }

      setSelectedBooking(null);
      await fetchAwaiting();
    } catch (err: any) {
      showToast(err.message || 'Weighment recording failed', 'error');
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
          <h1>Weighbridge & Electronic Scale Terminal</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Weighbridge Incharge: <strong>{user?.fullName}</strong> • Certified Double-Entry Weighment Desk
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAwaiting}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid-2">
        {/* Left: Quality-Approved Queue */}
        <div className="nivaran-card">
          <div className="card-header">
            <h3 className="card-title">
              <Scale size={18} color="var(--color-primary-700)" />
              Quality-Approved Trucks Awaiting Weighment ({data?.awaiting?.length || 0})
            </h3>
          </div>

          {data?.awaiting && data.awaiting.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.awaiting.map((item: any) => {
                const isSelected = selectedBooking?.tokenId === item.tokenId;
                return (
                  <div
                    key={item.tokenId}
                    onClick={() => setSelectedBooking(item)}
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
                      <span className="badge badge-success">Assay: {item.qualityAssay?.grade}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-main)' }}>
                      Farmer: <strong>{item.farmer?.fullName}</strong> • Booked: <strong>{item.allocatedQuantity} Qtl {item.crop}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-subtle)' }}>
              No vehicles currently queued for weighment. Only lots passing Quality Assay appear here.
            </div>
          )}
        </div>

        {/* Right: Weighment Entry Form */}
        <div className="nivaran-card">
          <div className="card-header">
            <h3 className="card-title">Enter Certified Scale Weights</h3>
            {selectedBooking && (
              <span style={{ fontWeight: 700, color: 'var(--color-primary-800)' }}>
                Token #{selectedBooking.tokenId}
              </span>
            )}
          </div>

          {selectedBooking ? (
            <form onSubmit={handleSubmitWeighment}>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.84rem' }}>
                Farmer: <strong>{selectedBooking.farmer?.fullName}</strong> • Booked Allocation: <strong>{selectedBooking.allocatedQuantity} Qtl</strong> ({selectedBooking.crop})
              </div>

              <div className="form-group">
                <label className="form-label">Gross Vehicle Weight (Tractor/Truck + Produce) [Qtl]</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="form-input"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tare Vehicle Weight (Empty Vehicle Tare) [Qtl]</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Real-time Calculation Panel */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: excess > 0 ? '#fff7ed' : 'var(--color-primary-50)',
                  border: excess > 0 ? '1px solid #fdba74' : '1px solid var(--color-primary-200)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Calculated Net Produce:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                    {netWeight} Quintals
                  </span>
                </div>

                {excess > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                    Notice: Delivered net produce exceeds booked quota by {excess} Qtl. This will automatically generate a Quantity Adjustment Request for Centre Manager authorization.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  {submitting ? 'Certifying Weights...' : 'Certify Net Weight & Confirm Procurement'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-subtle)' }}>
              Select an approved vehicle from the queue to enter scale measurements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
