import React from 'react';

export const PredictiveAnalyticsChart: React.FC = () => {
  const hourlyData = [
    { hour: '08:00 AM', before: 350, after: 150 },
    { hour: '10:00 AM', before: 450, after: 160 },
    { hour: '12:00 PM', before: 380, after: 155 },
    { hour: '02:00 PM', before: 120, after: 150 },
    { hour: '04:00 PM', before: 90, after: 145 },
  ];

  return (
    <div className="nivaran-card" style={{ width: '100%' }}>
      <div className="card-header">
        <div>
          <h2 style={{ fontWeight: 900, color: 'var(--color-primary-900)' }}>
            Predictive Storage & Throughput Expansion Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
            Before vs. After MandiSync harvest arrival surge distribution curve
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="nivaran-card" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>Peak Congestion Drop</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626' }}>-42.6%</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Zero bottleneck stalls</div>
        </div>

        <div className="nivaran-card" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>Weighbridge Utilization</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary-700)' }}>88.4%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>Continuous throughput</div>
        </div>

        <div className="nivaran-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>Average Farmer Wait</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706' }}>18 Mins</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Down from 4.5 hours</div>
        </div>

        <div className="nivaran-card" style={{ background: '#f3e8ff', borderColor: '#d8b4fe' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>Daily Mandi Inflow</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7e22ce' }}>1,200 Qtl</div>
          <div style={{ fontSize: '0.75rem', color: '#7e22ce' }}>Holding capacity optimal</div>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="nivaran-card" style={{ padding: '20px' }}>
        <h4 style={{ fontWeight: 800, marginBottom: '16px', color: 'var(--color-primary-900)' }}>
          Hourly Harvest Arrival Surge (Quintals / Hour)
        </h4>

        <div
          style={{
            height: '220px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            borderBottom: '2px solid var(--color-border-subtle)',
            paddingBottom: '12px',
          }}
        >
          {hourlyData.map((d, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: `${d.before / 2.5}px`,
                    background: '#ef4444',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '4px',
                  }}
                  title={`Unmanaged Surge: ${d.before} Qtl`}
                />
                <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>{d.before} Qtl</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>{d.hour} (Before)</div>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: `${d.after / 2.5}px`,
                    background: 'var(--color-primary-600)',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '4px',
                  }}
                  title={`MandiSync Managed: ${d.after} Qtl`}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--color-primary-700)', fontWeight: 700 }}>{d.after} Qtl</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>{d.hour} (MandiSync)</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
