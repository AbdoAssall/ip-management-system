export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  avatar?: string;
}

export interface Role {
  id: string;
  name: 'Admin' | 'IT Manager' | 'IT Support' | 'Read Only';
  description: string;
  permissions: string[];
}

export type DeviceCategoryName =
  | 'Router'
  | 'Switch'
  | 'Core Switch'
  | 'Server'
  | 'PC'
  | 'Laptop'
  | 'Fingerprint Device'
  | 'Camera'
  | 'Firewall'
  | 'IP Phone'
  | 'Access Point';

export interface DeviceCategory {
  id: string;
  name: DeviceCategoryName;
  icon: string;
  color: string;
  description: string;
}

export type DeviceStatus = 'Online' | 'Offline' | 'Maintenance' | 'Retired' | 'Stored';

export interface Device {
  id: string;
  deviceName: string;
  assetTag: string;
  categoryId: string;
  category?: DeviceCategory;
  brand: string;
  model: string;
  serialNumber: string;
  hostname: string;
  status: DeviceStatus;
  purchaseDate: string;
  warrantyExpiration: string;
  notes: string;

  // Network
  ipAddress: string;
  subnetMask: string;
  defaultGateway: string;
  macAddress: string;
  vlanId: string;
  dns: string;
  dhcpStatic: 'DHCP' | 'Static';

  // Location
  locationId: string;
  location?: Location;
  departmentId: string;
  department?: Department;
  branchId: string;
  branch?: Branch;
  floor: string;
  room: string;
  building: string;

  // Responsible Person
  employeeId: string;
  employee?: Employee;

  // Security
  lastMaintenance: string;
  securityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  backupStatus: 'Active' | 'Inactive' | 'N/A';
  monitoringEnabled: boolean;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPAddress {
  id: string;
  ipAddress: string;
  deviceId: string | null;
  device?: Device;
  vlanId: string;
  vlan?: VLAN;
  status: 'Assigned' | 'Available' | 'Reserved' | 'Duplicate';
  type: 'IPv4' | 'IPv6';
  notes: string;
  assignedAt: string | null;
}

export interface VLAN {
  id: string;
  vlanNumber: number;
  name: string;
  subnet: string;
  gateway: string;
  description: string;
}

export interface Location {
  id: string;
  branchId: string;
  branch?: Branch;
  building: string;
  floor: string;
  room: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
  branch?: Branch;
}

export interface Employee {
  id: string;
  fullName: string;
  employeeCode: string;
  phone: string;
  email: string;
  departmentId: string;
  department?: Department;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'IP_CHANGE';
  entityType: 'Device' | 'IP Address' | 'User' | 'VLAN' | 'Location' | 'Department' | 'Branch';
  entityId: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddressSource: string;
  createdAt: string;
}

export type NotificationType = 'duplicate_ip' | 'warranty_expiry' | 'device_offline' | 'maintenance_due' | 'security_alert';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  userId: string | null;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  device?: Device;
  type: 'Preventive' | 'Corrective' | 'Upgrade' | 'Inspection';
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  performedBy: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface WarrantyRecord {
  id: string;
  deviceId: string;
  device?: Device;
  provider: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  coverageType: 'Full' | 'Parts Only' | 'Labor Only' | 'Extended';
  notes: string;
}

export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  totalIPs: number;
  assignedIPs: number;
  availableIPs: number;
  duplicateIPs: number;
  devicesByCategory: { name: string; count: number; color: string }[];
  recentDevices: Device[];
  ipUtilization: { vlan: string; used: number; total: number }[];
}

export interface FilterState {
  search: string;
  category: string;
  status: string;
  branch: string;
  department: string;
  brand: string;
  assetTag: string;
  employeeName: string;
  ipAddress: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: Partial<FilterState>;
  createdAt: string;
}
