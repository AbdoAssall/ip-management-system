import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/lib/utils';
import { Search, ScrollText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };

const actionColors: Record<string, string> = { CREATE: '#10B981', UPDATE: '#3B82F6', DELETE: '#EF4444', LOGIN: '#8B5CF6', LOGOUT: '#6B7280', IP_CHANGE: '#F59E0B' };

interface ApiAuditLog {
  id: string;
  userId: string;
  user?: { fullName: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddressSource: string;
  createdAt: string;
}

export default function AuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entityType', filterEntity);
      params.set('limit', '100');
      const res = await fetch(`${API_URL}/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, filterAction, filterEntity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side search filter
  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.user?.fullName?.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Audit Logs</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{filtered.length} log entries</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user..." style={{ ...inputStyle, paddingLeft: 40 }} />
        </div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ ...inputStyle, width: 150, appearance: 'none' as const, cursor: 'pointer' }}>
          <option value="">All Actions</option>
          {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IP_CHANGE'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} style={{ ...inputStyle, width: 150, appearance: 'none' as const, cursor: 'pointer' }}>
          <option value="">All Entities</option>
          {['Device', 'IP Address', 'User', 'VLAN'].map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading audit logs...</div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              {['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Source'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{log.user?.fullName || 'Unknown'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${actionColors[log.action] || '#6B7280'}15`, color: actionColors[log.action] || '#6B7280', fontWeight: 600 }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{log.entityType}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.previousValue && log.newValue ? (
                      <span>{JSON.stringify(log.previousValue)} → {JSON.stringify(log.newValue)}</span>
                    ) : log.newValue ? (
                      <span>{JSON.stringify(log.newValue)}</span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ipAddressSource}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No audit logs found</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
