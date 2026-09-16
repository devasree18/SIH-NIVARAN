import React, { useState, useEffect } from 'react';
import { Tv, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { CongestionIndicator } from '../components/CongestionIndicator';

export const PublicQueueBoardPage: React.FC = () => {
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [board, setBoard] = useState<any>(null);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const res = await api.getCentres();
        setCentres(res || []);
        if (res && res.length > 0) {
          setSelectedCentreId(res[0].id);
        }
      } catch {
        // ignore
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Tv size={28} color="var(--color-primary-800)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>Live Mandi Queue & Token Display</h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
              Official High-Visibility Yard Screen for Farmers & Transporters
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            style={{ width: 'auto', fontWeight: 700, minHeight: '40px' }}
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchBoard} aria-label="Refresh Queue Board">
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
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* NOW SERVING BOARD */}
        <div
          className="nivaran-card"
          style={{
            backgroundColor: '#081c15',
            color: '#ffffff',
            border: '3px solid #2d6a4f',
            padding: 'clamp(16px, 3vw, 24px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#74c69d',
              borderBottom: '2px solid #2d6a4f',
              paddingBottom: '12px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <span>NOW SERVING / वर्तमान सेवारत</span>
            <span style={{ fontSize: '0.78rem', color: '#ffffff', backgroundColor: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              LIVE
            </span>
          </div>

          {board?.nowServing && board.nowServing.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {board.nowServing.map((item: any) => (
                <div
                  key={item.tokenId}
                  style={{
                    backgroundColor: '#1b4332',
                    padding: 'clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 20px)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '6px solid #52b788',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '0.03em', wordBreak: 'break-word' }}>
                      #{item.tokenId}
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#b7e4c7', marginTop: '2px', wordBreak: 'break-word' }}>
                      {item.farmerName} • <strong>{item.crop}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        backgroundColor: '#52b788',
                        color: '#081c15',
                        fontWeight: 900,
                        fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      COUNTER #{item.counterNumber || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#74c69d', fontSize: '1rem' }}>
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
            padding: 'clamp(16px, 3vw, 24px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              fontWeight: 800,
              color: 'var(--color-primary-900)',
              borderBottom: '2px solid var(--color-border-subtle)',
              paddingBottom: '12px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <span>NEXT IN LINE / अगले टोकन</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
              Waiting: {board?.waitingCount || 0}
            </span>
          </div>

          {board?.nextInLine && board.nextInLine.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {board.nextInLine.slice(0, 6).map((item: any) => (
                <div
                  key={item.tokenId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-700)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.queueNumber}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary-900)' }}>
                        #{item.tokenId}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {item.farmerName}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary-800)', fontSize: '0.86rem' }}>
                    {item.quantity} Qtl {item.crop}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-subtle)', fontSize: '0.95rem' }}>
              All checked-in farmers have been called.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
