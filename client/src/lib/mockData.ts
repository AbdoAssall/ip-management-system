import type { Device, IPAddress, Employee, AuditLog, Notification, User } from '@/types';
import { DEVICE_CATEGORIES, DEFAULT_BRANCHES, DEFAULT_DEPARTMENTS, DEFAULT_VLANS, ROLES } from './constants';

const employees: Employee[] = [
  { id: 'emp-01', fullName: 'Ahmed Hassan', employeeCode: 'PS-1001', phone: '+20-101-234-5678', email: 'ahmed.hassan@pscchc.com', departmentId: 'dep-01' },
  { id: 'emp-02', fullName: 'Mohamed Ali', employeeCode: 'PS-1002', phone: '+20-102-345-6789', email: 'mohamed.ali@pscchc.com', departmentId: 'dep-02' },
  { id: 'emp-03', fullName: 'Sara Ibrahim', employeeCode: 'PS-1003', phone: '+20-103-456-7890', email: 'sara.ibrahim@pscchc.com', departmentId: 'dep-03' },
  { id: 'emp-04', fullName: 'Khaled Mahmoud', employeeCode: 'PS-1004', phone: '+20-104-567-8901', email: 'khaled.mahmoud@pscchc.com', departmentId: 'dep-05' },
  { id: 'emp-05', fullName: 'Fatma Nabil', employeeCode: 'PS-1005', phone: '+20-105-678-9012', email: 'fatma.nabil@pscchc.com', departmentId: 'dep-04' },
  { id: 'emp-06', fullName: 'Omar Youssef', employeeCode: 'PS-1006', phone: '+20-106-789-0123', email: 'omar.youssef@pscchc.com', departmentId: 'dep-06' },
  { id: 'emp-07', fullName: 'Nour Saeed', employeeCode: 'PS-1007', phone: '+20-107-890-1234', email: 'nour.saeed@pscchc.com', departmentId: 'dep-07' },
  { id: 'emp-08', fullName: 'Tarek Adel', employeeCode: 'PS-1008', phone: '+20-108-901-2345', email: 'tarek.adel@pscchc.com', departmentId: 'dep-01' },
];

const users: User[] = [
  { id: 'usr-01', username: 'admin', email: 'admin@pscchc.com', fullName: 'System Administrator', role: ROLES[0], isActive: true, lastLogin: '2026-06-03T06:30:00Z', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'usr-02', username: 'it.manager', email: 'it.manager@pscchc.com', fullName: 'Ahmed Hassan', role: ROLES[1], isActive: true, lastLogin: '2026-06-02T14:00:00Z', createdAt: '2025-02-15T00:00:00Z' },
  { id: 'usr-03', username: 'it.support', email: 'it.support@pscchc.com', fullName: 'Tarek Adel', role: ROLES[2], isActive: true, lastLogin: '2026-06-01T09:00:00Z', createdAt: '2025-03-10T00:00:00Z' },
  { id: 'usr-04', username: 'viewer', email: 'viewer@pscchc.com', fullName: 'Sara Ibrahim', role: ROLES[3], isActive: true, lastLogin: '2026-05-28T11:00:00Z', createdAt: '2025-06-01T00:00:00Z' },
];

function makeDevices(): Device[] {
  const d: Device[] = [];
  const statuses: Device['status'][] = ['Online','Online','Online','Online','Offline','Maintenance','Online','Online','Stored','Online'];
  const secLevels: Device['securityLevel'][] = ['Low','Medium','High','Critical'];
  const items = [
    { cat: 'cat-09', name: 'FW-CORE-01', brand: 'Fortinet', model: 'FortiGate 200F', ip: '10.10.10.2', vlan: 'vlan-01', mac: 'AA:BB:CC:01:01:01', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-09', name: 'FW-DMZ-01', brand: 'Fortinet', model: 'FortiGate 100F', ip: '10.10.100.2', vlan: 'vlan-07', mac: 'AA:BB:CC:01:01:02', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-03', name: 'CS-CORE-01', brand: 'Cisco', model: 'Catalyst 9500', ip: '10.10.10.3', vlan: 'vlan-01', mac: 'AA:BB:CC:02:01:01', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-03', name: 'CS-CORE-02', brand: 'Cisco', model: 'Catalyst 9500', ip: '10.10.10.4', vlan: 'vlan-01', mac: 'AA:BB:CC:02:01:02', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-01', name: 'RT-MAIN-01', brand: 'Cisco', model: 'ISR 4451', ip: '10.10.10.5', vlan: 'vlan-01', mac: 'AA:BB:CC:03:01:01', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-01', name: 'RT-BRANCH-02', brand: 'Cisco', model: 'ISR 4331', ip: '10.10.10.6', vlan: 'vlan-01', mac: 'AA:BB:CC:03:01:02', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-02', name: 'SW-FL1-01', brand: 'Cisco', model: 'Catalyst 2960X', ip: '10.10.10.11', vlan: 'vlan-01', mac: 'AA:BB:CC:04:01:01', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-02', name: 'SW-FL2-01', brand: 'HP', model: 'Aruba 2930F', ip: '10.10.10.12', vlan: 'vlan-01', mac: 'AA:BB:CC:04:01:02', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-02', name: 'SW-FL3-01', brand: 'HP', model: 'Aruba 2930F', ip: '10.10.10.13', vlan: 'vlan-01', mac: 'AA:BB:CC:04:01:03', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-04', name: 'SRV-DC-01', brand: 'Dell', model: 'PowerEdge R750', ip: '10.10.20.10', vlan: 'vlan-02', mac: 'AA:BB:CC:05:01:01', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-04', name: 'SRV-DC-02', brand: 'Dell', model: 'PowerEdge R750', ip: '10.10.20.11', vlan: 'vlan-02', mac: 'AA:BB:CC:05:01:02', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-04', name: 'SRV-APP-01', brand: 'HP', model: 'ProLiant DL380', ip: '10.10.20.12', vlan: 'vlan-02', mac: 'AA:BB:CC:05:01:03', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-04', name: 'SRV-BACKUP', brand: 'Dell', model: 'PowerEdge R640', ip: '10.10.20.13', vlan: 'vlan-02', mac: 'AA:BB:CC:05:01:04', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-05', name: 'PC-OPS-001', brand: 'Dell', model: 'OptiPlex 7090', ip: '10.10.30.20', vlan: 'vlan-03', mac: 'AA:BB:CC:06:01:01', dept: 'dep-02', emp: 'emp-02' },
    { cat: 'cat-05', name: 'PC-FIN-001', brand: 'Dell', model: 'OptiPlex 7090', ip: '10.10.30.21', vlan: 'vlan-03', mac: 'AA:BB:CC:06:01:02', dept: 'dep-03', emp: 'emp-03' },
    { cat: 'cat-05', name: 'PC-HR-001', brand: 'HP', model: 'ProDesk 400 G7', ip: '10.10.30.22', vlan: 'vlan-03', mac: 'AA:BB:CC:06:01:03', dept: 'dep-04', emp: 'emp-05' },
    { cat: 'cat-05', name: 'PC-SEC-001', brand: 'Dell', model: 'OptiPlex 5090', ip: '10.10.30.23', vlan: 'vlan-03', mac: 'AA:BB:CC:06:01:04', dept: 'dep-05', emp: 'emp-04' },
    { cat: 'cat-06', name: 'LT-IT-001', brand: 'Lenovo', model: 'ThinkPad X1 Carbon', ip: '10.10.30.50', vlan: 'vlan-03', mac: 'AA:BB:CC:07:01:01', dept: 'dep-01', emp: 'emp-01' },
    { cat: 'cat-06', name: 'LT-IT-002', brand: 'Lenovo', model: 'ThinkPad T14s', ip: '10.10.30.51', vlan: 'vlan-03', mac: 'AA:BB:CC:07:01:02', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-06', name: 'LT-MGR-001', brand: 'Dell', model: 'Latitude 7430', ip: '10.10.30.52', vlan: 'vlan-03', mac: 'AA:BB:CC:07:01:03', dept: 'dep-02', emp: 'emp-02' },
    { cat: 'cat-10', name: 'PH-OPS-001', brand: 'Yealink', model: 'T46U', ip: '10.10.40.10', vlan: 'vlan-04', mac: 'AA:BB:CC:08:01:01', dept: 'dep-02', emp: 'emp-02' },
    { cat: 'cat-10', name: 'PH-FIN-001', brand: 'Yealink', model: 'T43U', ip: '10.10.40.11', vlan: 'vlan-04', mac: 'AA:BB:CC:08:01:02', dept: 'dep-03', emp: 'emp-03' },
    { cat: 'cat-10', name: 'PH-HR-001', brand: 'Polycom', model: 'VVX 450', ip: '10.10.40.12', vlan: 'vlan-04', mac: 'AA:BB:CC:08:01:03', dept: 'dep-04', emp: 'emp-05' },
    { cat: 'cat-08', name: 'CAM-GATE-01', brand: 'Hikvision', model: 'DS-2CD2T86G2', ip: '10.10.50.10', vlan: 'vlan-05', mac: 'AA:BB:CC:09:01:01', dept: 'dep-05', emp: 'emp-04' },
    { cat: 'cat-08', name: 'CAM-YARD-01', brand: 'Hikvision', model: 'DS-2CD2T46G2', ip: '10.10.50.11', vlan: 'vlan-05', mac: 'AA:BB:CC:09:01:02', dept: 'dep-05', emp: 'emp-04' },
    { cat: 'cat-08', name: 'CAM-DOCK-01', brand: 'Dahua', model: 'IPC-HFW5442T', ip: '10.10.50.12', vlan: 'vlan-05', mac: 'AA:BB:CC:09:01:03', dept: 'dep-05', emp: 'emp-04' },
    { cat: 'cat-07', name: 'FP-GATE-01', brand: 'ZKTeco', model: 'SpeedFace-V5L', ip: '10.10.50.20', vlan: 'vlan-05', mac: 'AA:BB:CC:10:01:01', dept: 'dep-05', emp: 'emp-04' },
    { cat: 'cat-07', name: 'FP-LOBBY-01', brand: 'ZKTeco', model: 'ProFace X', ip: '10.10.50.21', vlan: 'vlan-05', mac: 'AA:BB:CC:10:01:02', dept: 'dep-04', emp: 'emp-05' },
    { cat: 'cat-11', name: 'AP-FL1-01', brand: 'Ubiquiti', model: 'UniFi U6 Pro', ip: '10.10.60.10', vlan: 'vlan-06', mac: 'AA:BB:CC:11:01:01', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-11', name: 'AP-FL2-01', brand: 'Ubiquiti', model: 'UniFi U6 LR', ip: '10.10.60.11', vlan: 'vlan-06', mac: 'AA:BB:CC:11:01:02', dept: 'dep-01', emp: 'emp-08' },
    { cat: 'cat-11', name: 'AP-FL3-01', brand: 'Aruba', model: 'AP-535', ip: '10.10.60.12', vlan: 'vlan-06', mac: 'AA:BB:CC:11:01:03', dept: 'dep-01', emp: 'emp-01' },
  ];

  items.forEach((item, i) => {
    const cat = DEVICE_CATEGORIES.find(c => c.id === item.cat)!;
    const daysAgo = Math.floor(Math.random() * 365);
    const purchaseDate = new Date(2023, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
    const warrantyExp = new Date(purchaseDate);
    warrantyExp.setFullYear(warrantyExp.getFullYear() + 3);
    d.push({
      id: `dev-${String(i+1).padStart(3,'0')}`,
      deviceName: item.name,
      assetTag: `PSCCHC-${String(2000+i).padStart(5,'0')}`,
      categoryId: item.cat,
      category: cat,
      brand: item.brand,
      model: item.model,
      serialNumber: `SN${String(Math.random()).slice(2,14)}`,
      hostname: item.name.toLowerCase(),
      status: statuses[i % statuses.length],
      purchaseDate: purchaseDate.toISOString(),
      warrantyExpiration: warrantyExp.toISOString(),
      notes: '',
      ipAddress: item.ip,
      subnetMask: '255.255.255.0',
      defaultGateway: item.ip.replace(/\.\d+$/, '.1'),
      macAddress: item.mac,
      vlanId: item.vlan,
      dns: '10.10.10.2',
      dhcpStatic: i < 15 ? 'Static' : 'DHCP',
      locationId: 'loc-01',
      departmentId: item.dept,
      branchId: 'br-01',
      floor: `Floor ${(i % 3) + 1}`,
      room: `Room ${100 + (i % 10)}`,
      building: 'Main Building',
      employeeId: item.emp,
      employee: employees.find(e => e.id === item.emp),
      lastMaintenance: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      securityLevel: secLevels[i % 4],
      backupStatus: i < 13 ? 'Active' : 'N/A',
      monitoringEnabled: i < 20,
      createdBy: 'usr-01',
      createdAt: new Date(Date.now() - (365 - i * 10) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  });
  return d;
}

function makeIPs(devices: Device[]): IPAddress[] {
  const ips: IPAddress[] = devices.map((dev, i) => ({
    id: `ip-${String(i+1).padStart(3,'0')}`,
    ipAddress: dev.ipAddress,
    deviceId: dev.id,
    device: dev,
    vlanId: dev.vlanId,
    status: 'Assigned' as const,
    type: 'IPv4' as const,
    notes: '',
    assignedAt: dev.createdAt,
  }));
  // Add available IPs
  for (let i = 100; i < 120; i++) {
    ips.push({
      id: `ip-avl-${i}`,
      ipAddress: `10.10.30.${i}`,
      deviceId: null,
      vlanId: 'vlan-03',
      status: 'Available',
      type: 'IPv4',
      notes: '',
      assignedAt: null,
    });
  }
  // Add reserved IPs
  ['10.10.20.100','10.10.20.101','10.10.10.250'].forEach((ip, i) => {
    ips.push({
      id: `ip-rsv-${i}`,
      ipAddress: ip,
      deviceId: null,
      vlanId: ip.startsWith('10.10.20') ? 'vlan-02' : 'vlan-01',
      status: 'Reserved',
      type: 'IPv4',
      notes: 'Reserved for future use',
      assignedAt: null,
    });
  });
  return ips;
}

function makeAuditLogs(): AuditLog[] {
  const actions: AuditLog['action'][] = ['CREATE','UPDATE','LOGIN','DELETE','IP_CHANGE'];
  const entities: AuditLog['entityType'][] = ['Device','IP Address','User','VLAN'];
  const logs: AuditLog[] = [];
  for (let i = 0; i < 50; i++) {
    const action = actions[i % actions.length];
    logs.push({
      id: `log-${String(i+1).padStart(3,'0')}`,
      userId: `usr-0${(i%4)+1}`,
      action,
      entityType: entities[i % entities.length],
      entityId: `dev-${String((i%31)+1).padStart(3,'0')}`,
      previousValue: action === 'UPDATE' ? { status: 'Offline' } : null,
      newValue: action === 'UPDATE' ? { status: 'Online' } : action === 'CREATE' ? { deviceName: 'New Device' } : null,
      ipAddressSource: '192.168.1.100',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }
  return logs;
}

function makeNotifications(): Notification[] {
  return [
    { id: 'notif-01', type: 'duplicate_ip', title: 'Duplicate IP Detected', message: 'IP 10.10.30.20 is assigned to multiple devices', severity: 'error', userId: null, isRead: false, referenceId: 'ip-014', referenceType: 'IPAddress', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif-02', type: 'warranty_expiry', title: 'Warranty Expiring Soon', message: 'Device SRV-DC-01 warranty expires in 30 days', severity: 'warning', userId: null, isRead: false, referenceId: 'dev-010', referenceType: 'Device', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'notif-03', type: 'device_offline', title: 'Device Offline', message: 'SW-FL3-01 has been offline for more than 1 hour', severity: 'error', userId: null, isRead: false, referenceId: 'dev-009', referenceType: 'Device', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: 'notif-04', type: 'maintenance_due', title: 'Maintenance Due', message: 'Scheduled maintenance for FW-CORE-01 is overdue', severity: 'warning', userId: null, isRead: true, referenceId: 'dev-001', referenceType: 'Device', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'notif-05', type: 'security_alert', title: 'Unauthorized Access Attempt', message: 'Multiple failed login attempts detected from 192.168.1.55', severity: 'critical', userId: null, isRead: false, referenceId: null, referenceType: null, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'notif-06', type: 'warranty_expiry', title: 'Warranty Expired', message: 'Device RT-BRANCH-02 warranty has expired', severity: 'info', userId: null, isRead: true, referenceId: 'dev-006', referenceType: 'Device', createdAt: new Date(Date.now() - 172800000).toISOString() },
  ];
}

const devices = makeDevices();
const ipAddresses = makeIPs(devices);
const auditLogs = makeAuditLogs();
const notifications = makeNotifications();

export const mockData = {
  users,
  employees,
  devices,
  ipAddresses,
  auditLogs,
  notifications,
  categories: DEVICE_CATEGORIES,
  branches: DEFAULT_BRANCHES,
  departments: DEFAULT_DEPARTMENTS,
  vlans: DEFAULT_VLANS,
  roles: ROLES,
};

export default mockData;
