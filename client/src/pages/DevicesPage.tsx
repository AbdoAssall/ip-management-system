import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DEVICE_CATEGORIES, STATUS_OPTIONS, DEFAULT_BRANCHES, DEFAULT_DEPARTMENTS, DEVICE_BRANDS, SECURITY_LEVELS, BACKUP_STATUSES, DEFAULT_VLANS } from '@/lib/constants';
import { formatDate, formatDateTime, generateId } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import type { Device, Employee } from '@/types';
import { Plus, Search, Edit2, Trash2, Eye, ArrowLeft, Monitor, Server, Router, Network, Layers, Laptop, Fingerprint, Camera, Shield, Phone, Wifi, HardDrive, Globe, Save, UserCircle, Activity, RefreshCw } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Router, Network, Layers, Server, Monitor, Laptop, Fingerprint, Camera, Shield, Phone, Wifi };
const IS: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
const LS: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 };
const SS: React.CSSProperties = { ...IS, appearance: 'none' as const, cursor: 'pointer' };

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

type Mode = 'list' | 'view' | 'edit' | 'add';

export default function DevicesPage() {
  const { token } = useAuth();
  const { getDeviceStatus, requestPing, isConnected, deviceStatuses } = useWebSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [mode, setMode] = useState<Mode>('list');
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/devices?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const normalized: Device[] = (data.devices || []).map((d: any) => ({
          ...d,
          ipAddress: d.ipAddresses?.[0]?.ipAddress || d.ipAddress || '',
          purchaseDate: d.purchaseDate || '',
          warrantyExpiration: d.warrantyExpiration || '',
          notes: d.notes || '',
          lastMaintenance: d.lastMaintenance || '',
        }));
        setDevices(normalized);
      }
    } catch (err) {
      console.warn('DevicesPage: API fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Refresh when WebSocket reconnects
  useEffect(() => {
    if (isConnected) fetchDevices();
  }, [isConnected, fetchDevices]);

  // Fetch employees for the Responsibility tab
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  const empty: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
    deviceName: '', assetTag: '', categoryId: 'cat-01', brand: '', model: '', serialNumber: '', hostname: '',
    status: 'Online', purchaseDate: '', warrantyExpiration: '', notes: '', ipAddress: '', subnetMask: '255.255.255.0',
    defaultGateway: '', macAddress: '', vlanId: 'vlan-01', dns: '10.10.10.2', dhcpStatic: 'Static',
    locationId: '', departmentId: 'dep-01', branchId: 'br-01', floor: '', room: '', building: 'Main Building',
    employeeId: '', lastMaintenance: '', securityLevel: 'Medium', backupStatus: 'N/A', monitoringEnabled: false,
  };
  const [form, setForm] = useState(empty);
  const sf = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  // Merge WebSocket live status into device list
  const liveDevices = useMemo(() => {
    if (deviceStatuses.size === 0) return devices;
    return devices.map(d => {
      const ws = deviceStatuses.get(d.id);
      if (ws) {
        return { ...d, status: ws.status as Device['status'] };
      }
      return d;
    });
  }, [devices, deviceStatuses]);

  const filtered = useMemo(() => liveDevices.filter(d => {
    const q = search.toLowerCase();
    return (!q || d.deviceName.toLowerCase().includes(q) || d.ipAddress.includes(q) || d.assetTag.toLowerCase().includes(q) || d.hostname.toLowerCase().includes(q))
      && (!filterCat || d.categoryId === filterCat) && (!filterStatus || d.status === filterStatus) && (!filterBranch || d.branchId === filterBranch);
  }), [liveDevices, search, filterCat, filterStatus, filterBranch]);

  const goView = (d: Device) => { setActiveDevice(d); setFormTab(0); setMode('view'); };
  const goEdit = (d: Device) => { setActiveDevice(d); const { id, createdAt, updatedAt, createdBy, category, location, department, branch, employee, ...rest } = d; setForm(rest as typeof empty); setFormTab(0); setMode('edit'); };
  const goAdd = () => { setActiveDevice(null); setForm(empty); setFormTab(0); setMode('add'); };
  const goList = () => { setMode('list'); setActiveDevice(null); setFormTab(0); };

  const save = async () => {
    if (!token) return;
    try {
      if (mode === 'edit' && activeDevice) {
        const res = await fetch(`${API_URL}/api/devices/${activeDevice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success('Device updated successfully');
          await fetchDevices();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to update device');
        }
      } else {
        const res = await fetch(`${API_URL}/api/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success('Device added successfully');
          await fetchDevices();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to add device');
        }
      }
    } catch (err) {
      toast.error('Network error');
    }
    goList();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this device?')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Device deleted');
        await fetchDevices();
      } else {
        toast.error('Failed to delete device');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const tabs = [
    { l: 'General', i: Monitor },
    { l: 'Network', i: Globe },
    { l: 'Location', i: Layers },
    { l: 'Responsibility', i: UserCircle },
    { l: 'Security', i: Shield },
  ];

  // ── DETAIL / FORM VIEW ──
  if (mode !== 'list') {
    const dev = activeDevice;
    const isView = mode === 'view';
    const cat = dev ? DEVICE_CATEGORIES.find(c => c.id === dev.categoryId) : DEVICE_CATEGORIES.find(c => c.id === form.categoryId);
    const title = isView ? dev!.deviceName : mode === 'edit' ? dev!.deviceName : 'Add New Device';
    const status = isView ? dev!.status : mode === 'edit' ? dev!.status : form.status;

    // VIEW data
    const viewData: Record<string, [string, string | undefined][]> = dev ? {
      General: [['Device Name', dev.deviceName], ['Hostname', dev.hostname], ['Asset Tag', dev.assetTag], ['Serial Number', dev.serialNumber], ['Brand', dev.brand], ['Model', dev.model], ['Purchase Date', formatDate(dev.purchaseDate)], ['Warranty Expiry', formatDate(dev.warrantyExpiration)], ['Notes', dev.notes || '—']],
      Network: [['IP Address', dev.ipAddress], ['Subnet Mask', dev.subnetMask], ['Default Gateway', dev.defaultGateway], ['MAC Address', dev.macAddress], ['DNS', dev.dns], ['DHCP / Static', dev.dhcpStatic], ['VLAN', DEFAULT_VLANS.find(v => v.id === dev.vlanId)?.name || '—']],
      Location: [['Branch', DEFAULT_BRANCHES.find(b => b.id === dev.branchId)?.name || '—'], ['Department', DEFAULT_DEPARTMENTS.find(d => d.id === dev.departmentId)?.name || '—'], ['Building', dev.building], ['Floor', dev.floor], ['Room', dev.room]],
      Responsibility: [['Employee', dev.employee?.fullName || '—'], ['Code', dev.employee?.employeeCode || '—'], ['Phone', dev.employee?.phone || '—'], ['Email', dev.employee?.email || '—']],
      Security: [['Security Level', dev.securityLevel], ['Backup', dev.backupStatus], ['Monitoring', dev.monitoringEnabled ? 'Enabled' : 'Disabled'], ['Last Maintenance', formatDate(dev.lastMaintenance)]],
    } : {};

    // Live ping status for this device
    const pingStatus = dev ? getDeviceStatus(dev.id) : undefined;

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={goList} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><ArrowLeft size={18} /></button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{title}</h2>
                {(isView || mode === 'edit') && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: status === 'Online' ? '#10B98120' : status === 'Offline' ? '#EF444420' : '#F59E0B20', color: status === 'Online' ? '#10B981' : status === 'Offline' ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>{status}</span>}
                {isView && pingStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div className={pingStatus.isReachable ? 'ws-connected-dot' : 'ws-disconnected-dot'} />
                    <span style={{ fontSize: 11, color: pingStatus.isReachable ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                      {pingStatus.isReachable ? 'Reachable' : 'Unreachable'}
                    </span>
                  </div>
                )}
              </div>
              {dev && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: cat?.color, display: 'inline-block', marginRight: 6 }} />{cat?.name} • {dev.brand} {dev.model}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isView && dev && (
              <button onClick={() => requestPing(dev.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }} title="Ping this device now">
                <RefreshCw size={14} /> Ping
              </button>
            )}
            {isView && <button onClick={() => goEdit(dev!)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--bg-navy)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Edit2 size={14} /> Edit Device</button>}
            {!isView && <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #008793, #004D7A)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Save size={14} /> {mode === 'edit' ? 'Update' : 'Save Device'}</button>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-primary)' }}>
          {tabs.map((t, i) => (<button key={t.l} onClick={() => setFormTab(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', border: 'none', background: 'none', fontSize: 13, fontWeight: formTab === i ? 600 : 400, color: formTab === i ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: formTab === i ? '2px solid var(--accent-primary)' : '2px solid transparent' }}><t.i size={15} /> {t.l}</button>))}
        </div>

        {/* Content */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '0 0 14px 14px', border: '1px solid var(--border-primary)', borderTop: 'none', padding: '28px 32px', boxShadow: 'var(--shadow-card)' }}>
          {isView ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {(viewData[tabs[formTab].l] || []).map(([label, value]) => (
                  <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                    <div style={{ fontSize: 12, color: 'var(--accent-primary)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
              {/* Live Connectivity Panel — shown only in view mode */}
              {pingStatus && (
                <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Activity size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Live Connectivity</span>
                    {isConnected && <div className="ping-pulse" style={{ marginLeft: 4 }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={pingStatus.isReachable ? 'ws-connected-dot' : 'ws-disconnected-dot'} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: pingStatus.isReachable ? '#10B981' : '#EF4444' }}>
                          {pingStatus.isReachable ? 'Reachable' : 'Unreachable'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Response Time</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pingStatus.responseTimeMs != null ? `${pingStatus.responseTimeMs}ms` : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Last Checked</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatDateTime(pingStatus.lastChecked)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Last Seen Online</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {pingStatus.lastSeenOnline ? formatDateTime(pingStatus.lastSeenOnline) : '—'}
                      </div>
                    </div>
                  </div>
                  {pingStatus.consecutiveFailures > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, background: '#EF444410', border: '1px solid #EF444420', fontSize: 12, color: '#EF4444', fontWeight: 500 }}>
                      ⚠ {pingStatus.consecutiveFailures} consecutive ping failure{pingStatus.consecutiveFailures > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {formTab === 0 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><label style={LS}>Device Name *</label><input value={form.deviceName} onChange={e => sf('deviceName', e.target.value)} style={IS} /></div><div><label style={LS}>Hostname</label><input value={form.hostname} onChange={e => sf('hostname', e.target.value)} style={IS} /></div><div><label style={LS}>Asset Tag *</label><input value={form.assetTag} onChange={e => sf('assetTag', e.target.value)} style={IS} /></div><div><label style={LS}>Serial Number</label><input value={form.serialNumber} onChange={e => sf('serialNumber', e.target.value)} style={IS} /></div><div><label style={LS}>Category</label><select value={form.categoryId} onChange={e => sf('categoryId', e.target.value)} style={SS}>{DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label style={LS}>Brand</label><select value={form.brand} onChange={e => sf('brand', e.target.value)} style={SS}><option value="">Select</option>{DEVICE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}</select></div><div><label style={LS}>Model</label><input value={form.model} onChange={e => sf('model', e.target.value)} style={IS} /></div><div><label style={LS}>Status</label><select value={form.status} onChange={e => sf('status', e.target.value)} style={SS}>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div><div><label style={LS}>Purchase Date</label><input type="date" value={form.purchaseDate?.split('T')[0] || ''} onChange={e => sf('purchaseDate', e.target.value)} style={IS} /></div><div><label style={LS}>Warranty Expiration</label><input type="date" value={form.warrantyExpiration?.split('T')[0] || ''} onChange={e => sf('warrantyExpiration', e.target.value)} style={IS} /></div><div style={{ gridColumn: '1/-1' }}><label style={LS}>Notes</label><textarea value={form.notes} onChange={e => sf('notes', e.target.value)} rows={3} style={{ ...IS, resize: 'vertical' }} /></div></div>}
              {formTab === 1 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><label style={LS}>IP Address</label><input value={form.ipAddress} onChange={e => sf('ipAddress', e.target.value)} style={IS} placeholder="10.10.x.x" /></div><div><label style={LS}>Subnet Mask</label><input value={form.subnetMask} onChange={e => sf('subnetMask', e.target.value)} style={IS} /></div><div><label style={LS}>Default Gateway</label><input value={form.defaultGateway} onChange={e => sf('defaultGateway', e.target.value)} style={IS} /></div><div><label style={LS}>MAC Address</label><input value={form.macAddress} onChange={e => sf('macAddress', e.target.value)} style={IS} placeholder="AA:BB:CC:DD:EE:FF" /></div><div><label style={LS}>VLAN</label><select value={form.vlanId} onChange={e => sf('vlanId', e.target.value)} style={SS}>{DEFAULT_VLANS.map(v => <option key={v.id} value={v.id}>VLAN {v.vlanNumber} - {v.name}</option>)}</select></div><div><label style={LS}>DNS</label><input value={form.dns} onChange={e => sf('dns', e.target.value)} style={IS} /></div><div><label style={LS}>DHCP / Static</label><select value={form.dhcpStatic} onChange={e => sf('dhcpStatic', e.target.value)} style={SS}><option value="Static">Static</option><option value="DHCP">DHCP</option></select></div></div>}
              {formTab === 2 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><label style={LS}>Branch</label><select value={form.branchId} onChange={e => sf('branchId', e.target.value)} style={SS}>{DEFAULT_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div><label style={LS}>Department</label><select value={form.departmentId} onChange={e => sf('departmentId', e.target.value)} style={SS}>{DEFAULT_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div><label style={LS}>Building</label><input value={form.building} onChange={e => sf('building', e.target.value)} style={IS} /></div><div><label style={LS}>Floor</label><input value={form.floor} onChange={e => sf('floor', e.target.value)} style={IS} /></div><div><label style={LS}>Room</label><input value={form.room} onChange={e => sf('room', e.target.value)} style={IS} /></div></div>}
              {formTab === 3 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div style={{ gridColumn: '1/-1' }}><label style={LS}>Assigned Employee</label><select value={form.employeeId} onChange={e => sf('employeeId', e.target.value)} style={SS}><option value="">Select</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}</select></div></div>}
              {formTab === 4 && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><label style={LS}>Security Level</label><select value={form.securityLevel} onChange={e => sf('securityLevel', e.target.value)} style={SS}>{SECURITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label style={LS}>Backup Status</label><select value={form.backupStatus} onChange={e => sf('backupStatus', e.target.value)} style={SS}>{BACKUP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label style={LS}>Last Maintenance</label><input type="date" value={form.lastMaintenance?.split('T')[0] || ''} onChange={e => sf('lastMaintenance', e.target.value)} style={IS} /></div><div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}><input type="checkbox" id="mon" checked={form.monitoringEnabled} onChange={e => sf('monitoringEnabled', e.target.checked)} /><label htmlFor="mon" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Monitoring Enabled</label></div></div>}
            </>
          )}
        </div>

        {/* Bottom actions for form */}
        {!isView && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={goList} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #008793, #004D7A)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{mode === 'edit' ? 'Update Device' : 'Add Device'}</button>
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Device Management</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{filtered.length} devices found</p></div>
        <button onClick={goAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #008793, #004D7A)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-heading)', boxShadow: '0 4px 12px rgba(0,135,147,0.25)' }}><Plus size={16} /> Add Device</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}><Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices, IPs, asset tags..." style={{ ...IS, paddingLeft: 40 }} /></div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...SS, width: 160 }}><option value="">All Categories</option>{DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...SS, width: 140 }}><option value="">All Status</option>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ ...SS, width: 160 }}><option value="">All Branches</option>{DEFAULT_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead><tr style={{ background: 'var(--bg-tertiary)' }}>{['Device', 'IP Address', 'Category', 'Brand / Model', 'Status', 'Branch', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(dev => { const cat = DEVICE_CATEGORIES.find(c => c.id === dev.categoryId); const Icon = cat ? iconMap[cat.icon] : HardDrive; const branch = DEFAULT_BRANCHES.find(b => b.id === dev.branchId); return (
              <tr key={dev.id} style={{ borderBottom: '1px solid var(--border-secondary)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: `${cat?.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon && <Icon size={17} style={{ color: cat?.color }} />}</div><div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{dev.deviceName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dev.assetTag}</div></div></div></td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{dev.ipAddress}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${cat?.color}15`, color: cat?.color, fontWeight: 500 }}>{cat?.name}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{dev.brand} {dev.model}</td>
                <td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className={(() => { const ps = getDeviceStatus(dev.id); return ps ? (ps.isReachable ? 'ws-connected-dot' : 'ws-disconnected-dot') : ''; })()} style={{ width: 7, height: 7, borderRadius: '50%', background: dev.status === 'Online' ? '#10B981' : dev.status === 'Offline' ? '#EF4444' : '#F59E0B' }} /><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{dev.status}</span>{(() => { const ps = getDeviceStatus(dev.id); return ps?.responseTimeMs != null ? <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>{ps.responseTimeMs}ms</span> : null; })()}</div></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{branch?.name}</td>
                <td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => goView(dev)} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Eye size={14} /></button>
                  <button onClick={() => goEdit(dev)} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}><Edit2 size={14} /></button>
                  <button onClick={() => del(dev.id)} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><Trash2 size={14} /></button>
                </div></td>
              </tr>); })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
