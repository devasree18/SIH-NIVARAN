import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { QueuePositionCard } from '../components/QueuePositionCard';
import { ProcurementTimeline } from '../components/ProcurementTimeline';
import { CongestionIndicator } from '../components/CongestionIndicator';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';
import { StatusBadge } from '../components/StatusBadge';

interface FarmerDashboardProps {
  onNavigate: (route: string, params?: any) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { t } = useLanguage();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getFarmerDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || t.queueError, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 12000); // 12s live update
    return () => clearInterval(interval);
  }, [user]);

  const handleCheckIn = async (tokenId: string) => {
    setCheckingIn(true);
    try {
      const res = await api.checkIn(tokenId);
      showToast(res.message || 'Check-in confirmed!', 'success');
      await fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleViewReceipt = async (tokenId: string) => {
    try {
      const receipt = await api.getDigitalReceipt(tokenId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      showToast(err.message || 'Receipt not available yet', 'warning');
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={60} />
      </div>
    );
  }

  const activeBooking = data?.activeBooking;

  return (
    <div className="content-body">
      {/* Top Welcome Bar */}
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
          <h1 style={{ color: 'var(--color-primary-900)' }}>
            Welcome, {user?.farmer?.fullName || user?.fullName}
          </h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Farmer ID: <strong>{user?.farmerId || 'FARMER-IND-2026'}</strong> • District: <strong>{user?.farmer?.district || 'Karnal'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchDashboard} title="Refresh Data">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('book-slot')}>
            <PlusCircle size={16} /> {t.bookSlot}
          </button>
        </div>
      </div>

      {/* Active Token & Queue Position Card */}
      {activeBooking ? (
        <>
          <QueuePositionCard
            booking={activeBooking}
            farmersAhead={data?.farmersAhead || 0}
            estimatedWaitMinutes={data?.estimatedWaitMinutes || 0}
            nextAction={data?.nextAction}
            onCheckIn={() => handleCheckIn(activeBooking.tokenId)}
            checkingIn={checkingIn}
          />

          {/* Detailed Timeline Tracker */}
          <ProcurementTimeline booking={activeBooking} />
        </>
      ) : (
        <EmptyState
          title={t.noAppointments}
          description="Book a guaranteed mandi procurement slot to eliminate waiting time and secure your Minimum Support Price (MSP)."
          actionText={t.bookSlot}
          onAction={() => onNavigate('book-slot')}
        />
      )}

      {/* Past Procurement & Receipts Section */}
      <div className="nivaran-card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={18} color="var(--color-primary-700)" />
            Recent Procurement History & Receipts
          </h3>
        </div>

        {data?.history && data.history.length > 0 ? (
          <div className="table-container">
            <table className="nivaran-table">
              <thead>
                <tr>
                  <th>Procurement ID</th>
                  <th>Crop</th>
                  <th>Procurement Centre</th>
                  <th>Accepted Qty</th>
                  <th>Rate / Qtl</th>
                  <th>Payable Amount</th>
                  <th>DBT Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((record: any) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>{record.procurementId}</td>
                    <td>{record.crop}</td>
                    <td>{record.centre?.name}</td>
                    <td style={{ fontWeight: 600 }}>{record.finalProcuredQuantity} Qtl</td>
                    <td>₹{record.applicableRate}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary-800)' }}>
                      ₹{record.payableAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <StatusBadge status={record.payment?.status || 'INITIATED'} />
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleViewReceipt(record.tokenId)}
                      >
                        {t.viewReceipt}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            No past procurement records found.
          </div>
        )}
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <DigitalReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
