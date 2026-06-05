import { useState, useMemo } from 'react';
import { mockData } from '@/lib/mockData';
import { DEVICE_CATEGORIES, DEFAULT_BRANCHES, DEFAULT_DEPARTMENTS } from '@/lib/constants';
import { formatDate, exportToCSV } from '@/lib/utils';
import { FileBarChart, Download, FileText, Table, Printer } from 'lucide-react';

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };

type ReportType = 'inventory' | 'asset' | 'ip' | 'maintenance' | 'warranty' | 'category';

const reportTypes: { key: ReportType; label: string; desc: string }[] = [
  { key: 'inventory', label: 'Device Inventory', desc: 'Complete list of all devices' },
  { key: 'asset', label: 'Asset Report', desc: 'Asset tags, purchase & warranty info' },
  { key: 'ip', label: 'IP Address Report', desc: 'All IP allocations and status' },
  { key: 'maintenance', label: 'Maintenance Report', desc: 'Maintenance schedules and history' },
  { key: 'warranty', label: 'Warranty Report', desc: 'Warranty status and expirations' },
  { key: 'category', label: 'Category Report', desc: 'Devices grouped by category' },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportType>('inventory');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportData = useMemo(() => {
    const devices = mockData.devices;
    switch (selected) {
      case 'inventory':
        return devices.map((d) => ({
          'Device Name': d.deviceName, 'Asset Tag': d.assetTag, 'Category': DEVICE_CATEGORIES.find((c) => c.id === d.categoryId)?.name,
          'IP Address': d.ipAddress, 'Status': d.status, 'Brand': d.brand, 'Model': d.model,
          'Branch': DEFAULT_BRANCHES.find((b) => b.id === d.branchId)?.name, 'Department': DEFAULT_DEPARTMENTS.find((dp) => dp.id === d.departmentId)?.name,
        }));
      case 'asset':
        return devices.map((d) => ({
          'Asset Tag': d.assetTag, 'Device Name': d.deviceName, 'Serial Number': d.serialNumber,
          'Purchase Date': formatDate(d.purchaseDate), 'Warranty Expires': formatDate(d.warrantyExpiration),
          'Brand': d.brand, 'Model': d.model, 'Status': d.status,
        }));
      case 'ip':
        return mockData.ipAddresses.map((ip) => ({
          'IP Address': ip.ipAddress, 'Status': ip.status, 'Device': ip.device?.deviceName || '—',
          'VLAN': mockData.vlans.find((v) => v.id === ip.vlanId)?.name || '—', 'Type': ip.type,
        }));
      case 'warranty':
        return devices.map((d) => ({
          'Device': d.deviceName, 'Asset Tag': d.assetTag, 'Warranty Expires': formatDate(d.warrantyExpiration),
          'Days Left': Math.ceil((new Date(d.warrantyExpiration).getTime() - Date.now()) / 86400000),
          'Status': new Date(d.warrantyExpiration) > new Date() ? 'Active' : 'Expired',
        }));
      case 'maintenance':
        return devices.map((d) => ({
          'Device': d.deviceName, 'Last Maintenance': formatDate(d.lastMaintenance),
          'Days Since': Math.ceil((Date.now() - new Date(d.lastMaintenance).getTime()) / 86400000),
          'Security Level': d.securityLevel, 'Monitoring': d.monitoringEnabled ? 'Yes' : 'No',
        }));
      case 'category':
        return DEVICE_CATEGORIES.map((c) => ({
          'Category': c.name, 'Total Devices': devices.filter((d) => d.categoryId === c.id).length,
          'Online': devices.filter((d) => d.categoryId === c.id && d.status === 'Online').length,
          'Offline': devices.filter((d) => d.categoryId === c.id && d.status === 'Offline').length,
        }));
      default:
        return [];
    }
  }, [selected]);

  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  const handleExportCSV = () => exportToCSV(reportData, `pscchc_${selected}_report`);

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `pscchc_${selected}_report.xlsx`);
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const rows = reportData.map((r) => `<tr>${headers.map((h) => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:12px">${(r as Record<string, unknown>)[h] ?? ''}</td>`).join('')}</tr>`).join('');
    printWin.document.write(`<html><head><title>PSCCHC Report</title></head><body style="font-family:Arial">
      <div style="text-align:center;margin-bottom:20px"><h2 style="color:#2A324A">PSCCHC</h2><p>Port Said Container & Cargo Handling Company</p><h3>${reportTypes.find(r => r.key === selected)?.label}</h3><p style="color:#777">Generated: ${new Date().toLocaleString()}</p></div>
      <table style="width:100%;border-collapse:collapse"><thead><tr>${headers.map((h) => `<th style="padding:8px 10px;border:1px solid #ddd;background:#2A324A;color:#fff;font-size:11px;text-align:left">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWin.document.close();
    printWin.print();
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Reports</h2>

      {/* Report Type Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {reportTypes.map((rt) => (
          <button key={rt.key} onClick={() => setSelected(rt.key)} style={{
            padding: '16px 18px', borderRadius: 12, border: selected === rt.key ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
            background: selected === rt.key ? 'rgba(0,135,147,0.06)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: selected === rt.key ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{rt.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{rt.desc}</div>
          </button>
        ))}
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <Download size={15} /> CSV
        </button>
        <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <Table size={15} /> Excel
        </button>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <Printer size={15} /> Print / PDF
        </button>
      </div>

      {/* Report Table Preview */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {headers.map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  {headers.map((h) => (
                    <td key={h} style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{String((row as Record<string, unknown>)[h] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
