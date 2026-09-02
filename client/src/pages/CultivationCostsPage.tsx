import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Info } from 'lucide-react';
import { api } from '../api/client';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const CultivationCostsPage: React.FC = () => {
  const [costs, setCosts] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costsRes, cropsRes] = await Promise.all([
          api.getCultivationCosts(),
          api.getCrops(),
        ]);
        setCosts(costsRes || []);
        setCrops(cropsRes || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={50} />
      </div>
    );
  }

  return (
    <div className="content-body">
      <div style={{ marginBottom: '20px' }}>
        <h1>Farm Input Cultivation Costs vs Minimum Support Price (MSP)</h1>
        <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.9rem' }}>
          Official economic baseline monitoring by Commission for Agricultural Costs & Prices (CACP) & State Directorate of Agriculture.
        </p>
      </div>

      {/* Official MSP Rates Card */}
      <div className="nivaran-card" style={{ marginBottom: '24px', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--color-primary-900)' }}>
            Official MSP Procurement Rates (Rabi / Kharif 2025-26)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-800)', fontWeight: 600 }}>
            Guaranteed Direct Benefit Transfer (DBT) Base
          </span>
        </div>

        <div className="grid-4">
          {crops.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {c.cropName} ({c.season})
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '4px' }}>
                ₹{c.procurementRatePerUnit}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)' }}>
                Per {c.quantityUnit} (A2+FL + 50% Profit Margin)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Category Breakdown Table */}
      <div className="nivaran-card">
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={18} color="var(--color-primary-700)" />
            Input Cost Trend Analysis & Inflation Index
          </h3>
        </div>

        <div className="table-container">
          <table className="nivaran-table">
            <thead>
              <tr>
                <th>Input Category</th>
                <th>Crop & Season</th>
                <th>Baseline Cost (₹/Acre)</th>
                <th>Current Cost (₹/Acre)</th>
                <th>Price Movement</th>
                <th>Data Source</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost) => {
                const isIncrease = cost.percentageChange > 0;
                return (
                  <tr key={cost.id}>
                    <td style={{ fontWeight: 700 }}>{cost.category}</td>
                    <td>{cost.crop} ({cost.season})</td>
                    <td>₹{cost.baselineCost.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>₹{cost.currentCost.toLocaleString('en-IN')}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 700,
                          color: isIncrease ? 'var(--color-danger)' : 'var(--color-success)',
                        }}
                      >
                        {isIncrease ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {cost.percentageChange}%
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      {cost.source}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      {new Date(cost.lastUpdated).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
