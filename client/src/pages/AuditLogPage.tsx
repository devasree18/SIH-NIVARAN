import React, { useState, useEffect } from 'react';
import { FileText, Shield, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs({ limit: 30 });
      setLogs(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="content-body">
        <LoadingSkeleton rows={4} height={45} />
      </div>
    );
  }

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>System Audit Trail & Governance Log</h1>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.88rem' }}>
            Cryptographically timestamped immutable administrative records for all slot, token, assay, weight, and DBT actions.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="nivaran-card">
        <div className="table-container">
          <table className="nivaran-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Reason / Justification</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.actor}</td>
                  <td>
                    <span className="badge badge-neutral">{log.actorRole}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>
                    {log.action}
                  </td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    {log.entityType} ({log.entityId.slice(0, 12)}...)
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
