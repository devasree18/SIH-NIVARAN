import React, { useState, useEffect } from 'react';
import { Calendar, Building, Sprout, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { CongestionIndicator } from '../components/CongestionIndicator';
import { CapacityIndicator } from '../components/CapacityIndicator';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface BookSlotPageProps {
  onNavigate: (route: string, params?: any) => void;
}

export const BookSlotPage: React.FC<BookSlotPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { t } = useLanguage();

  const [centres, setCentres] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState<number>(30);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotsData, setSlotsData] = useState<any>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCentresAndCrops = async () => {
      try {
        const [centresRes, cropsRes] = await Promise.all([api.getCentres(), api.getCrops()]);
        setCentres(centresRes || []);
        setCrops(cropsRes || []);

        if (centresRes && centresRes.length > 0) {
          setSelectedCentreId(centresRes[0].id);
        }
        if (cropsRes && cropsRes.length > 0) {
          setSelectedCrop(cropsRes[0].cropName);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load centres and crops', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchCentresAndCrops();
  }, []);

  useEffect(() => {
    if (!selectedCentreId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.getSlots(selectedCentreId, selectedDate);
        setSlotsData(res);
        setSelectedSlotId(''); // reset slot selection
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch slots', 'error');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedCentreId, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      showToast('Quantity must be greater than zero.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        centreId: selectedCentreId,
        crop: selectedCrop,
        requestedQuantity: Number(quantity),
        preferredDate: selectedDate,
        slotId: selectedSlotId || undefined, // undefined triggers smart automatic slot allocation
        idempotencyKey: `idem-${user?.farmerId || 'F'}-${selectedDate}-${Date.now()}`,
      };

      const res = await api.bookSlot(payload);
      showToast(t.slotBookedSuccess, 'success');
      onNavigate('farmer-dashboard');
    } catch (err: any) {
      showToast(err.message || 'Slot reservation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={50} />
      </div>
    );
  }

  const selectedCentre = centres.find((c) => c.id === selectedCentreId);
  const selectedCropConfig = crops.find((c) => c.cropName === selectedCrop);

  return (
    <div className="content-body" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>{t.bookSlot}</h1>
        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.9rem' }}>
          Direct government slot reservation with intelligent congestion avoidance and anti-collision protection.
        </p>
      </div>

      <form onSubmit={handleBook}>
        <div className="grid-2">
          {/* Left Column: Form Controls */}
          <div className="nivaran-card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              <Building size={18} color="var(--color-primary-700)" />
              Select Mandi & Produce
            </h3>

            {/* Procurement Centre Selection */}
            <div className="form-group">
              <label className="form-label">Procurement Centre (Mandi Hub)</label>
              <select
                className="form-select"
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                required
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}) - {c.operationalStatus}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Selection */}
            <div className="form-group">
              <label className="form-label">Crop & MSP Rate</label>
              <select
                className="form-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                required
              >
                {crops.map((cr) => (
                  <option key={cr.id} value={cr.cropName}>
                    {cr.cropName} (MSP: ₹{cr.procurementRatePerUnit} / {cr.quantityUnit})
                  </option>
                ))}
              </select>
              {selectedCropConfig && (
                <div className="form-hint" style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>
                  Guaranteed Procurement Price: ₹{selectedCropConfig.procurementRatePerUnit} / Quintal
                </div>
              )}
            </div>

            {/* Requested Quantity */}
            <div className="form-group">
              <label className="form-label">Estimated Quantity (Quintals)</label>
              <input
                type="number"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min="1"
                step="0.5"
                required
              />
              <div className="form-hint">
                Max daily farmer quota: 100 Quintals per booking. Excess will require manager approval.
              </div>
            </div>

            {/* Date Selection */}
            <div className="form-group">
              <label className="form-label">Preferred Arrival Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Right Column: Real-time Centre Status & Congestion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {slotsData?.congestion && (
              <CongestionIndicator congestion={slotsData.congestion} />
            )}

            {selectedCentre && (
              <div className="nivaran-card">
                <h4 style={{ fontSize: '0.96rem', marginBottom: '10px', color: 'var(--color-primary-900)' }}>
                  Centre Operational Profile
                </h4>
                <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Address:</strong> {selectedCentre.address}</div>
                  <div><strong>Daily Capacity:</strong> {selectedCentre.dailyCapacity} Quintals</div>
                  <div><strong>Active Weighbridge:</strong> {selectedCentre.weighbridgeAvailability ? 'Operational' : 'Non-Operational'}</div>
                  <div><strong>Active Counters:</strong> {selectedCentre.activeCounters} inspection lines</div>
                  <div><strong>Average Service Time:</strong> ~{selectedCentre.averageServiceMinutes} minutes / farmer</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slot Picker Grid */}
        <div className="nivaran-card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} color="var(--color-primary-700)" />
              Choose Appointment Slot on {selectedDate}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              Or leave unselected for Smart Best-Time Allocation
            </span>
          </div>

          {loadingSlots ? (
            <LoadingSkeleton rows={2} height={40} />
          ) : slotsData?.slots && slotsData.slots.length > 0 ? (
            <div className="grid-3" style={{ gap: '12px' }}>
              {slotsData.slots.map((slot: any) => {
                const isSelected = selectedSlotId === slot.id;
                const hasCapacity = slot.availableQuantity >= quantity;

                return (
                  <div
                    key={slot.id}
                    onClick={() => hasCapacity && setSelectedSlotId(isSelected ? '' : slot.id)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected
                        ? '2px solid var(--color-primary-700)'
                        : '1px solid var(--color-border-subtle)',
                      backgroundColor: isSelected
                        ? 'var(--color-primary-50)'
                        : hasCapacity
                        ? 'var(--color-bg-surface)'
                        : 'var(--color-bg-subtle)',
                      cursor: hasCapacity ? 'pointer' : 'not-allowed',
                      opacity: hasCapacity ? 1 : 0.6,
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span
                        className={`badge ${hasCapacity ? 'badge-success' : 'badge-danger'}`}
                      >
                        {hasCapacity ? 'Available' : 'Full'}
                      </span>
                    </div>

                    <CapacityIndicator
                      totalCapacity={slot.capacity}
                      reservedQuantity={slot.reservedQuantity}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-subtle)' }}>
              No slots configured yet for this date. Smart allocation will dynamically assign upon confirmation.
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }}
            >
              {submitting ? 'Reserving Capacity Safely...' : 'Confirm Guaranteed Slot & Generate Token'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
