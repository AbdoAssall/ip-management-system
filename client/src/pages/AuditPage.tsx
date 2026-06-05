import { useState, useMemo } from 'react';
import { mockData } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';
import { Search, Filter, ScrollText } from 'lucide-react';

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };

const actionColors: Record<string, string> = { CREATE: '#10B981', UPDATE: '#3B82F6', DELETE: '#EF4444', LOGIN: '#8B5CF6', LOGOUT: '#6B7280', IP_CHANGE: '#F59E0B' };

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const logs = useMemo(() => {
    return mockData.auditLogs.filter((log) => {
      const q = search.toLowerCase();
      const user = mockData.users.find((u) => u.id === log.userId);
      const matchSearch = !q || user?.fullName?.toLowerCase().includes(q) || log.entityType.toLowerCase().includes(q);
      const matchAction = !filterAction || log.action === filterAction;
      const matchEntity = !filterEntity || log.entityType === filterEntity;
      return matchSearch && matchAction && matchEntity;
    });
  }, [search, filterAction, filterEntity]);

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Audit Logs</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{logs.length} log entries</p>

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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              {['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Source'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const user = mockData.users.find((u) => u.id === log.userId);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{user?.fullName || 'Unknown'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${actionColors[log.action]}15`, color: actionColors[log.action], fontWeight: 600 }}>{log.action}</span>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
