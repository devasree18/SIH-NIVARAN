import React, { useState } from 'react';
import { UserRole } from '../context/AuthContext';

interface TokenItem {
  id: string;
  tokenId: string;
  farmerName: string;
  crop: string;
  quantity: number;
  queueNumber: number;
  counterNumber?: number;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'WAITING' | 'CALLED' | 'PROCESSING' | 'COMPLETED' | 'DELAYED';
}

export const DynamicQueueBoard: React.FC = () => {
  const [tokens, setTokens] = useState<TokenItem[]>([
    { id: '1', tokenId: 'TKN-KNL-01-001', farmerName: 'Ramesh Kumar', crop: 'Wheat', quantity: 40, queueNumber: 1, counterNumber: 1, status: 'PROCESSING' },
    { id: '2', tokenId: 'TKN-KNL-01-002', farmerName: 'Gurpreet Singh', crop: 'Wheat', quantity: 50, queueNumber: 2, status: 'CHECKED_IN' },
    { id: '3', tokenId: 'TKN-KNL-01-003', farmerName: 'Harpal Singh', crop: 'Mustard', quantity: 35, queueNumber: 3, status: 'WAITING' },
    { id: '4', tokenId: 'TKN-KNL-01-004', farmerName: 'Suresh Verma', crop: 'Gram', quantity: 60, queueNumber: 4, status: 'SCHEDULED' },
  ]);

  const [isSwapping, setIsSwapping] = useState(false);

  const handleCallNext = () => {
    setTokens((prev) => {
      const copy = [...prev];
      const waiting = copy.find((t) => t.status === 'CHECKED_IN' || t.status === 'WAITING');
      if (waiting) {
        waiting.status = 'CALLED';
        waiting.counterNumber = 1;
      }
      return copy;
    });
  };

  const handleTriggerAutoSwap = async () => {
    setIsSwapping(true);
    setTimeout(() => {
      setTokens((prev) => {
        const copy = [...prev];
        // Swap item 2 and 3 positions
        if (copy.length >= 3) {
          const tempNum = copy[1].queueNumber;
          copy[1].queueNumber = copy[2].queueNumber;
          copy[2].queueNumber = tempNum;
          copy[1].status = 'DELAYED';
          copy[2].status = 'WAITING';
        }
        return copy;
      });
      setIsSwapping(false);
      alert('🔄 Auto-Swap Engine: Late arrivals scanned. Reordered 1 slot and broadcasted SMS updates to farmers without penalty.');
    }, 600);
  };

  return (
    <div className="nivaran-card" style={{ width: '100%' }}>
      <div className="card-header">
        <div>
          <h2 style={{ fontWeight: 900, color: 'var(--color-primary-900)' }}>
            Karnal Central Mandi • Dynamic Live Queue Board
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
            Real-time arrival dispatch, automated counter callout & anti-delay auto-swapping
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleCallNext}>
            📢 Call Next Token to Counter
          </button>
          <button className="btn btn-secondary" onClick={handleTriggerAutoSwap} disabled={isSwapping}>
            {isSwapping ? '🔄 Processing Swap...' : '🔄 Trigger Auto-Swap Engine'}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '16px' }}>
        {/* Processing Column */}
        <div className="nivaran-card" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
          <h3 style={{ color: 'var(--color-primary-800)', marginBottom: '12px', fontWeight: 800 }}>
            🟢 Now Processing at Counters
          </h3>
          {tokens
            .filter((t) => t.status === 'PROCESSING' || t.status === 'CALLED')
            .map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid var(--color-primary-400)',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary-800)' }}>
                    #{item.tokenId} ({item.farmerName})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {item.quantity} Qtl {item.crop} • Assigned Counter #{item.counterNumber || 1}
                  </div>
                </div>
                <span className="badge badge-danger">Counter #{item.counterNumber || 1}</span>
              </div>
            ))}
        </div>

        {/* Pavilion Waiting Queue Column */}
        <div className="nivaran-card">
          <h3 style={{ color: 'var(--color-primary-900)', marginBottom: '12px', fontWeight: 800 }}>
            👥 Physically Waiting in Pavilion
          </h3>
          {tokens
            .filter((t) => t.status !== 'PROCESSING' && t.status !== 'CALLED')
            .map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '10px 14px',
                  background: 'var(--color-bg-subtle)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-subtle)',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>#{item.queueNumber}. {item.tokenId}</strong> - {item.farmerName} ({item.quantity} Qtl {item.crop})
                </div>
                <span className={item.status === 'DELAYED' ? 'badge badge-warning' : 'badge badge-info'}>
                  Position #{item.queueNumber}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
