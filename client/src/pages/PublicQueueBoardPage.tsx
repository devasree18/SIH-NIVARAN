import React, { useState, useEffect } from 'react';
import { Tv, Clock, Users, Activity, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { CongestionIndicator } from '../components/CongestionIndicator';
import { StatusBadge } from '../components/StatusBadge';

export const PublicQueueBoardPage: React.FC = () => {
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const res = await api.getCentres();
        setCentres(res || []);
        if (res && res.length > 0) {
          setSelectedCentreId(res[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCentres();
  }, []);

  const fetchBoard = async () => {
    if (!selectedCentreId) return;
    try {
      const res = await api.getLiveQueueBoard(selectedCentreId);
      setBoard(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 6000); // 6s fast polling for TV Mandi screens
    return () => clearInterval(interval);
  }, [selectedCentreId]);

  return (
    <div className="content-body" style={{ maxWidth: '1200px' }}>
      {/* Mandi TV Display Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Tv size={28} color="var(--color-primary-800)" />
          <div>
            <h1 style={{ fontSize: '1.6rem' }}>Live Mandi Queue & Token Display</h1>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-subtle)' }}>
              Official High-Visibility Yard Screen for Farmers & Transporters
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            style={{ width: 'auto', fontWeight: 700 }}
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchBoard}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {board?.congestion && (
        <div style={{ marginBottom: '20px' }}>
          <CongestionIndicator congestion={board.congestion} />
        </div>
      )}

      {/* Big Screen Board Grid */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* NOW SERVING BOARD */}
        <div
          className="nivaran-card"
          style={{
            backgroundColor: '#081c15',
            color: '#ffffff',
            border: '3px solid #2d6a4f',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: '#74c69d',
              borderBottom: '2px solid #2d6a4f',
              paddingBottom: '12px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>NOW SERVING / वर्तमान में सेवारत</span>
            <span style={{ fontSize: '0.85rem', color: '#ffffff', backgroundColor: '#dc2626', padding: '2px 8px', borderRadius: '4px' }}>
              LIVE
            </span>
          </div>

          {board?.nowServing && board.nowServing.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {board.nowServing.map((item: any) => (
                <div
                  key={item.tokenId}
                  style={{
                    backgroundColor: '#1b4332',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '8px solid #52b788',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
                      #{item.tokenId}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#b7e4c7', marginTop: '4px' }}>
                      {item.farmerName} • <strong>{item.crop}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        backgroundColor: '#52b788',
                        color: '#081c15',
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        padding: '6px 14px',
                        borderRadius: '6px',
                      }}
                    >
                      COUNTER #{item.counterNumber || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#74c69d', fontSize: '1.1rem' }}>
              Waiting for next counter call...
            </div>
          )}
        </div>

        {/* UPCOMING TOKENS */}
        <div
          className="nivaran-card"
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border-medium)',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--color-primary-900)',
              borderBottom: '2px solid var(--color-border-subtle)',
              paddingBottom: '12px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>NEXT IN LINE / अगले टोकन</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
              Waiting Count: {board?.waitingCount || 0}
            </span>
          </div>

          {board?.nextInLine && board.nextInLine.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {board.nextInLine.slice(0, 6).map((item: any) => (
                <div
                  key={item.tokenId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-700)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    >
                      {item.queueNumber}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-900)' }}>
                        #{item.tokenId}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {item.farmerName}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary-800)', fontSize: '0.9rem' }}>
                    {item.quantity} Qtl {item.crop}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-subtle)' }}>
              All checked-in farmers have been called.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
