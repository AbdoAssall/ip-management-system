import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { DEFAULT_BRANCHES, DEFAULT_DEPARTMENTS, DEFAULT_VLANS } from '@/lib/constants';
import { Sun, Moon, Monitor, MapPin, Building2, Layers, Plus, Trash2, X, Settings as SettingsIcon, Activity, Volume2, VolumeX, Power, PowerOff, Save } from 'lucide-react';
import type { Branch, Department, VLAN } from '@/types';
import { generateId } from '@/lib/utils';

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 };

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { monitorConfig, updateMonitorConfig, isConnected, soundEnabled, setSoundEnabled } = useWebSocket();
  const [tab, setTab] = useState<'appearance' | 'branches' | 'departments' | 'vlans' | 'monitoring'>('appearance');
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [vlans, setVlans] = useState<VLAN[]>(DEFAULT_VLANS);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});
  const [deptForm, setDeptForm] = useState<Partial<Department>>({});
  const [vlanForm, setVlanForm] = useState<Partial<VLAN>>({});

  // Local state for monitoring config — edit locally, apply on blur/button
  const [localConfig, setLocalConfig] = useState({
    pingIntervalMs: 30000,
    criticalIntervalMs: 10000,
    pingTimeoutS: 2,
    pingRetries: 2,
  });
  const [configDirty, setConfigDirty] = useState(false);

  // Sync local config from server
  useEffect(() => {
    if (monitorConfig) {
      setLocalConfig({
        pingIntervalMs: monitorConfig.pingIntervalMs,
        criticalIntervalMs: monitorConfig.criticalIntervalMs,
        pingTimeoutS: monitorConfig.pingTimeoutS,
        pingRetries: monitorConfig.pingRetries,
      });
      setConfigDirty(false);
    }
  }, [monitorConfig]);

  const setLocalField = useCallback((field: string, value: number) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setConfigDirty(true);
  }, []);

  const applyConfig = useCallback(() => {
    updateMonitorConfig(localConfig);
    setConfigDirty(false);
    toast.success('Monitoring config applied');
  }, [localConfig, updateMonitorConfig]);

  const tabs = [
    { key: 'appearance' as const, label: 'Appearance', icon: Sun },
    { key: 'monitoring' as const, label: 'Device Monitoring', icon: Activity },
    { key: 'branches' as const, label: 'Branches & Locations', icon: MapPin },
    { key: 'departments' as const, label: 'Departments', icon: Building2 },
    { key: 'vlans' as const, label: 'VLANs', icon: Layers },
  ];

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Settings</h2>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none',
                background: tab === t.key ? 'var(--bg-tertiary)' : 'transparent', color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', borderLeft: tab === t.key ? '3px solid var(--accent-primary)' : '3px solid transparent', textAlign: 'left', transition: 'all 0.2s',
              }}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {tab === 'appearance' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-primary)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'var(--font-heading)' }}>Appearance</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Choose your preferred theme for the dashboard.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { key: 'light' as const, label: 'Light', icon: Sun, desc: 'Bright and clean' },
                  { key: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                ].map((t) => (
                  <button key={t.key} onClick={() => { setTheme(t.key); toast.success(`Theme changed to ${t.label}`); }} style={{
                    flex: 1, padding: '20px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    border: theme === t.key ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                    background: theme === t.key ? 'rgba(0,135,147,0.06)' : 'var(--bg-tertiary)',
                  }}>
                    <t.icon size={28} style={{ color: theme === t.key ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme === t.key ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {user && (
                <div style={{ marginTop: 32 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'var(--font-heading)' }}>Profile</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[['Name', user.fullName], ['Email', user.email], ['Role', user.role.name], ['Username', user.username]].map(([k, v]) => (
                      <div key={k} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-tertiary)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'monitoring' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={18} style={{ color: 'var(--accent-primary)' }} /> Device Monitoring
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Configure ICMP ping monitoring for real-time device status.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: isConnected ? '#10B98112' : '#EF444412', border: `1px solid ${isConnected ? '#10B98130' : '#EF444430'}` }}>
                  <div className={isConnected ? 'ws-connected-dot' : 'ws-disconnected-dot'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: isConnected ? '#10B981' : '#EF4444' }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Enable/Disable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, background: 'var(--bg-tertiary)', marginBottom: 20, border: '1px solid var(--border-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {monitorConfig?.enabled ? <Power size={20} color="#10B981" /> : <PowerOff size={20} color="#EF4444" />}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Monitoring Engine</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monitorConfig?.enabled ? 'Active — pinging devices' : 'Disabled — no pings'}</div>
                  </div>
                </div>
                <button
                  onClick={() => { updateMonitorConfig({ enabled: !monitorConfig?.enabled }); toast.info(monitorConfig?.enabled ? 'Monitoring disabled' : 'Monitoring enabled'); }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: monitorConfig?.enabled ? '#EF4444' : '#10B981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {monitorConfig?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Timing Config */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Ping Intervals</h4>
                  {configDirty && (
                    <button
                      onClick={applyConfig}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #008793, #004D7A)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,135,147,0.3)', transition: 'all 0.2s' }}
                    >
                      <Save size={13} /> Apply Changes
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Normal Devices Interval (ms)</label>
                    <input
                      type="number"
                      value={localConfig.pingIntervalMs}
                      onChange={(e) => setLocalField('pingIntervalMs', Number(e.target.value))}
                      onBlur={configDirty ? applyConfig : undefined}
                      style={inputStyle}
                      min={5000} step={1000}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Default: 30000ms (30 seconds)</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Critical Devices Interval (ms)</label>
                    <input
                      type="number"
                      value={localConfig.criticalIntervalMs}
                      onChange={(e) => setLocalField('criticalIntervalMs', Number(e.target.value))}
                      onBlur={configDirty ? applyConfig : undefined}
                      style={inputStyle}
                      min={3000} step={1000}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Default: 10000ms (10 seconds). For switches, firewalls, routers, APs</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Ping Timeout (seconds)</label>
                    <input
                      type="number"
                      value={localConfig.pingTimeoutS}
                      onChange={(e) => setLocalField('pingTimeoutS', Number(e.target.value))}
                      onBlur={configDirty ? applyConfig : undefined}
                      style={inputStyle}
                      min={1} max={10}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Default: 2 seconds per ping attempt</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Retries Before Offline</label>
                    <input
                      type="number"
                      value={localConfig.pingRetries}
                      onChange={(e) => setLocalField('pingRetries', Number(e.target.value))}
                      onBlur={configDirty ? applyConfig : undefined}
                      style={inputStyle}
                      min={0} max={10}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Default: 2 retries before marking as unreachable</div>
                  </div>
                </div>
              </div>

              {/* Sound Alerts */}
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {soundEnabled ? <Volume2 size={20} color="var(--accent-primary)" /> : <VolumeX size={20} color="var(--text-muted)" />}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sound Alerts</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Play alarm when critical/high devices go offline, and chime when they recover</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSoundEnabled(!soundEnabled); toast.info(soundEnabled ? 'Sound alerts disabled' : 'Sound alerts enabled'); }}
                    style={{
                      width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s',
                      background: soundEnabled ? '#10B981' : 'var(--border-primary)',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                      left: soundEnabled ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'branches' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Branches & Locations</h3>
                <button onClick={() => { setBranchForm({}); setShowForm('branch'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, cursor: 'pointer' }}><Plus size={14} /> Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {branches.map((b) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.address}, {b.city}</div>
                    </div>
                    <button onClick={() => { setBranches((p) => p.filter((x) => x.id !== b.id)); toast.success('Branch deleted'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'departments' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Departments</h3>
                <button onClick={() => { setDeptForm({}); setShowForm('dept'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, cursor: 'pointer' }}><Plus size={14} /> Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {departments.map((d) => {
                  const br = branches.find((b) => b.id === d.branchId);
                  return (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{br?.name || '—'}</div>
                      </div>
                      <button onClick={() => { setDepartments((p) => p.filter((x) => x.id !== d.id)); toast.success('Department deleted'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={15} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'vlans' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>VLAN Configuration</h3>
                <button onClick={() => { setVlanForm({}); setShowForm('vlan'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, cursor: 'pointer' }}><Plus size={14} /> Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vlans.map((v) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)', minWidth: 70 }}>VLAN {v.vlanNumber}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{v.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v.subnet} • GW: {v.gateway}</div>
                      </div>
                    </div>
                    <button onClick={() => { setVlans((p) => p.filter((x) => x.id !== v.id)); toast.success('VLAN deleted'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Branch Modal */}
      {showForm === 'branch' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--bg-secondary)', borderRadius: 16, width: 420, padding: 28, border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Add Branch</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Name</label><input value={branchForm.name || ''} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Address</label><input value={branchForm.address || ''} onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>City</label><input value={branchForm.city || ''} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setBranches((p) => [...p, { id: generateId(), name: branchForm.name || '', address: branchForm.address || '', city: branchForm.city || '' }]); setShowForm(null); toast.success('Branch added successfully'); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dept Modal */}
      {showForm === 'dept' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--bg-secondary)', borderRadius: 16, width: 420, padding: 28, border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Add Department</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Name</label><input value={deptForm.name || ''} onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Branch</label><select value={deptForm.branchId || ''} onChange={(e) => setDeptForm((p) => ({ ...p, branchId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setDepartments((p) => [...p, { id: generateId(), name: deptForm.name || '', branchId: deptForm.branchId || 'br-01' }]); setShowForm(null); toast.success('Department added successfully'); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add VLAN Modal */}
      {showForm === 'vlan' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--bg-secondary)', borderRadius: 16, width: 420, padding: 28, border: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Add VLAN</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>VLAN Number</label><input type="number" value={vlanForm.vlanNumber || ''} onChange={(e) => setVlanForm((p) => ({ ...p, vlanNumber: +e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Name</label><input value={vlanForm.name || ''} onChange={(e) => setVlanForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Subnet</label><input value={vlanForm.subnet || ''} onChange={(e) => setVlanForm((p) => ({ ...p, subnet: e.target.value }))} style={inputStyle} placeholder="10.10.x.0/24" /></div>
              <div><label style={labelStyle}>Gateway</label><input value={vlanForm.gateway || ''} onChange={(e) => setVlanForm((p) => ({ ...p, gateway: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Description</label><input value={vlanForm.description || ''} onChange={(e) => setVlanForm((p) => ({ ...p, description: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setVlans((p) => [...p, { id: generateId(), vlanNumber: vlanForm.vlanNumber || 0, name: vlanForm.name || '', subnet: vlanForm.subnet || '', gateway: vlanForm.gateway || '', description: vlanForm.description || '' }]); setShowForm(null); toast.success('VLAN added successfully'); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
