import React, { useState, useEffect } from 'react';
import { ListOrdered, Bell, Play, Pause, UserCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const QueueOperatorPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [counterNum, setCounterNum] = useState<number>(1);
  const [manualCheckInId, setManualCheckInId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchQueueBoard = async () => {
    try {
      const centreId = user?.centreId || 'KNL-MANDI-01'; // default fallback
      // Find actual centre if centreId is a code or uuid
      const centres = await api.getCentres();
      const target = centres.find((c) => c.id === centreId || c.centreCode === centreId) || centres[0];

      if (target) {
        const res = await api.getLiveQueueBoard(target.id);
        setBoard(res);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch queue board', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueBoard();
    const interval = setInterval(fetchQueueBoard, 8000); // 8s polling for fast queue responsiveness
    return () => clearInterval(interval);
  }, [user]);

  const handleCallNext = async () => {
    if (!board?.centre?.id) return;

    setCallingNext(true);
    try {
      const res = await api.callNextToken(board.centre.id, counterNum);
      if (res.token) {
        showToast(`Called token #${res.token.tokenId} (${res.farmer.fullName}) to Counter #${counterNum}!`, 'success');
      } else {
        showToast(res.message || 'No farmers waiting in queue', 'info');
      }
      await fetchQueueBoard();
    } catch (err: any) {
      showToast(err.message || 'Failed to call next token', 'error');
    } finally {
      setCallingNext(false);
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCheckInId.trim()) return;

    setCheckingIn(true);
    try {
      const res = await api.checkIn(manualCheckInId.trim());
      showToast(res.message || 'Farmer marked arrived!', 'success');
      setManualCheckInId('');
      await fetchQueueBoard();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(false);
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
      {/* Header */}
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
          <h1>Queue Counter Operator Desk</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Mandi: <strong>{board?.centre?.name}</strong> • Active Line Management
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchQueueBoard}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Operator Action Bar */}
      <div className="nivaran-card" style={{ marginBottom: '24px', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-900)' }}>
              Operator Counter Station:
            </span>
            <select
              value={counterNum}
              onChange={(e) => setCounterNum(parseInt(e.target.value, 10))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #52b788',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <option value={1}>Counter #1 (Verification Desk)</option>
              <option value={2}>Counter #2 (Verification Desk)</option>
              <option value={3}>Counter #3 (Express Sampling)</option>
              <option value={4}>Counter #4 (Heavy Grain)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-success"
              style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: 800 }}
              onClick={handleCallNext}
              disabled={callingNext}
            >
              <Bell size={18} />
              {callingNext ? 'Calling Speaker...' : `Call Next Farmer to Counter #${counterNum}`}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Now Serving & Manual Desk Check-in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Now Serving Card */}
          <div className="nivaran-card" style={{ borderLeft: '6px solid var(--color-warning)' }}>
            <div className="card-header">
              <h3 className="card-title">Currently Serving at Counters</h3>
              <span className="badge badge-warning">Live Now</span>
            </div>

            {board?.nowServing && board.nowServing.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {board.nowServing.map((item: any) => (
                  <div
                    key={item.tokenId}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-900)' }}>
                        Token #{item.tokenId} (Queue #{item.queueNumber})
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        Farmer: <strong>{item.farmerName}</strong> • {item.crop} ({item.quantity} Qtl)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-danger">Counter #{item.counterNumber || 1}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
                        Called {new Date(item.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-subtle)' }}>
                No tokens currently active at inspection counters. Click "Call Next Farmer" above.
              </div>
            )}
          </div>

          {/* Manual Arrival Check-in Desk */}
          <div className="nivaran-card">
            <div className="card-header">
              <h3 className="card-title">
                <UserCheck size={18} color="var(--color-primary-700)" />
                Gate Arrival Check-in (Token / Farmer ID)
              </h3>
            </div>

            <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Token ID (e.g. TKN-KNL-01-002) or Farmer ID"
                value={manualCheckInId}
                onChange={(e) => setManualCheckInId(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={checkingIn}
                style={{ flexShrink: 0 }}
              >
                {checkingIn ? 'Checking in...' : 'Mark Arrived'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Next in Line Queue */}
        <div className="nivaran-card">
          <div className="card-header">
            <h3 className="card-title">
              <ListOrdered size={18} color="var(--color-primary-700)" />
              Next in Line (Waiting: {board?.waitingCount || 0})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              Ordered by arrival sequence
            </span>
          </div>

          {board?.nextInLine && board.nextInLine.length > 0 ? (
            <div className="table-container">
              <table className="nivaran-table">
                <thead>
                  <tr>
                    <th>Queue #</th>
                    <th>Token ID</th>
                    <th>Farmer Name</th>
                    <th>Produce</th>
                    <th>Arrival</th>
                  </tr>
                </thead>
                <tbody>
                  {board.nextInLine.map((nxt: any) => (
                    <tr key={nxt.tokenId}>
                      <td style={{ fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        #{nxt.queueNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>{nxt.tokenId}</td>
                      <td>{nxt.farmerName}</td>
                      <td>{nxt.crop} ({nxt.quantity} Qtl)</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                        {nxt.arrivalTime ? new Date(nxt.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-subtle)' }}>
              Queue is clear. No farmers waiting in line.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
