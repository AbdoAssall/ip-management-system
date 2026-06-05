import type { DeviceCategory, Role, Branch, Department, VLAN } from '@/types';

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  { id: 'cat-01', name: 'Router', icon: 'Router', color: '#6366F1', description: 'Network routers' },
  { id: 'cat-02', name: 'Switch', icon: 'Network', color: '#3B82F6', description: 'Network switches' },
  { id: 'cat-03', name: 'Core Switch', icon: 'Layers', color: '#06B6D4', description: 'Core network switches' },
  { id: 'cat-04', name: 'Server', icon: 'Server', color: '#8B5CF6', description: 'Servers and data center equipment' },
  { id: 'cat-05', name: 'PC', icon: 'Monitor', color: '#10B981', description: 'Desktop computers' },
  { id: 'cat-06', name: 'Laptop', icon: 'Laptop', color: '#059669', description: 'Portable laptops' },
  { id: 'cat-07', name: 'Fingerprint Device', icon: 'Fingerprint', color: '#F59E0B', description: 'Biometric fingerprint scanners' },
  { id: 'cat-08', name: 'Camera', icon: 'Camera', color: '#F43F5E', description: 'Security cameras and CCTV' },
  { id: 'cat-09', name: 'Firewall', icon: 'Shield', color: '#EF4444', description: 'Network firewalls' },
  { id: 'cat-10', name: 'IP Phone', icon: 'Phone', color: '#14B8A6', description: 'VoIP IP phones' },
  { id: 'cat-11', name: 'Access Point', icon: 'Wifi', color: '#7C3AED', description: 'Wireless access points' },
];

export const ROLES: Role[] = [
  { id: 'role-01', name: 'Admin', description: 'Full system access', permissions: ['*'] },
  { id: 'role-02', name: 'IT Manager', description: 'Manage devices and users', permissions: ['devices.*', 'ipam.*', 'reports.*', 'users.read'] },
  { id: 'role-03', name: 'IT Support', description: 'Manage devices and IPs', permissions: ['devices.*', 'ipam.*', 'reports.read'] },
  { id: 'role-04', name: 'Read Only', description: 'View-only access', permissions: ['*.read'] },
];

export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'br-01', name: 'Port Said HQ', address: 'Port Said West Port', city: 'Port Said' },
  { id: 'br-02', name: 'Cairo Office', address: 'Nasr City', city: 'Cairo' },
  { id: 'br-03', name: 'Alexandria Branch', address: 'Al Dekheila Port', city: 'Alexandria' },
  { id: 'br-04', name: 'East Port Said', address: 'East Port Said Port', city: 'Port Said' },
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dep-01', name: 'IT Department', branchId: 'br-01' },
  { id: 'dep-02', name: 'Operations', branchId: 'br-01' },
  { id: 'dep-03', name: 'Finance', branchId: 'br-01' },
  { id: 'dep-04', name: 'HR', branchId: 'br-01' },
  { id: 'dep-05', name: 'Security', branchId: 'br-01' },
  { id: 'dep-06', name: 'Maintenance', branchId: 'br-01' },
  { id: 'dep-07', name: 'Marine Operations', branchId: 'br-01' },
  { id: 'dep-08', name: 'Container Terminal', branchId: 'br-01' },
  { id: 'dep-09', name: 'IT Department', branchId: 'br-02' },
  { id: 'dep-10', name: 'Administration', branchId: 'br-02' },
];

export const DEFAULT_VLANS: VLAN[] = [
  { id: 'vlan-01', vlanNumber: 10, name: 'Management', subnet: '10.10.10.0/24', gateway: '10.10.10.1', description: 'Network management VLAN' },
  { id: 'vlan-02', vlanNumber: 20, name: 'Servers', subnet: '10.10.20.0/24', gateway: '10.10.20.1', description: 'Server farm VLAN' },
  { id: 'vlan-03', vlanNumber: 30, name: 'Workstations', subnet: '10.10.30.0/24', gateway: '10.10.30.1', description: 'Employee workstations' },
  { id: 'vlan-04', vlanNumber: 40, name: 'VoIP', subnet: '10.10.40.0/24', gateway: '10.10.40.1', description: 'Voice over IP' },
  { id: 'vlan-05', vlanNumber: 50, name: 'Security', subnet: '10.10.50.0/24', gateway: '10.10.50.1', description: 'Cameras and access control' },
  { id: 'vlan-06', vlanNumber: 60, name: 'Guest', subnet: '10.10.60.0/24', gateway: '10.10.60.1', description: 'Guest WiFi network' },
  { id: 'vlan-07', vlanNumber: 100, name: 'DMZ', subnet: '10.10.100.0/24', gateway: '10.10.100.1', description: 'Demilitarized zone' },
];

export const DEVICE_BRANDS = [
  'Cisco', 'HP', 'Dell', 'Lenovo', 'Juniper', 'Fortinet', 'Aruba',
  'Huawei', 'Ubiquiti', 'MikroTik', 'TP-Link', 'Hikvision', 'Dahua',
  'Yealink', 'Polycom', 'ZKTeco', 'Suprema', 'Samsung', 'Apple',
  'Microsoft', 'Asus', 'Acer', 'Other',
];

export const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'Online', label: 'Online', color: '#10B981' },
  { value: 'Offline', label: 'Offline', color: '#EF4444' },
  { value: 'Maintenance', label: 'Maintenance', color: '#F59E0B' },
  { value: 'Retired', label: 'Retired', color: '#6B7280' },
  { value: 'Stored', label: 'Stored', color: '#8B5CF6' },
];

export const SECURITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;
export const BACKUP_STATUSES = ['Active', 'Inactive', 'N/A'] as const;

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/devices', label: 'Devices', icon: 'HardDrive' },
  { path: '/ipam', label: 'IP Management', icon: 'Globe' },
  { path: '/reports', label: 'Reports', icon: 'FileBarChart' },
  { path: '/audit', label: 'Audit Logs', icon: 'ScrollText' },
  { path: '/users', label: 'Users', icon: 'Users' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];
