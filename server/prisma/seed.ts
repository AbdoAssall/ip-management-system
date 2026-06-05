import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PSCCHC database...');

  // Roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', description: 'Full system access', permissions: ['*'] } }),
    prisma.role.upsert({ where: { name: 'IT Manager' }, update: {}, create: { name: 'IT Manager', description: 'Manage devices and users', permissions: ['devices.*', 'ipam.*', 'reports.*', 'users.read'] } }),
    prisma.role.upsert({ where: { name: 'IT Support' }, update: {}, create: { name: 'IT Support', description: 'Manage devices and IPs', permissions: ['devices.*', 'ipam.*', 'reports.read'] } }),
    prisma.role.upsert({ where: { name: 'Read Only' }, update: {}, create: { name: 'Read Only', description: 'View-only access', permissions: ['*.read'] } }),
  ]);
  console.log('✅ Roles created');

  // Users
  const hash = await bcrypt.hash('admin123', 12);
  await Promise.all([
    prisma.user.upsert({ where: { email: 'admin@pscchc.com' }, update: {}, create: { username: 'admin', email: 'admin@pscchc.com', passwordHash: hash, fullName: 'System Administrator', roleId: roles[0].id } }),
    prisma.user.upsert({ where: { email: 'it.manager@pscchc.com' }, update: {}, create: { username: 'it.manager', email: 'it.manager@pscchc.com', passwordHash: hash, fullName: 'Ahmed Hassan', roleId: roles[1].id } }),
    prisma.user.upsert({ where: { email: 'it.support@pscchc.com' }, update: {}, create: { username: 'it.support', email: 'it.support@pscchc.com', passwordHash: hash, fullName: 'Tarek Adel', roleId: roles[2].id } }),
    prisma.user.upsert({ where: { email: 'viewer@pscchc.com' }, update: {}, create: { username: 'viewer', email: 'viewer@pscchc.com', passwordHash: hash, fullName: 'Sara Ibrahim', roleId: roles[3].id } }),
  ]);
  console.log('✅ Users created (password: admin123)');

  // Categories
  const categories = [
    { name: 'Router', icon: 'Router', color: '#6366F1', description: 'Network routers' },
    { name: 'Switch', icon: 'Network', color: '#3B82F6', description: 'Network switches' },
    { name: 'Core Switch', icon: 'Layers', color: '#06B6D4', description: 'Core network switches' },
    { name: 'Server', icon: 'Server', color: '#8B5CF6', description: 'Servers and data center equipment' },
    { name: 'PC', icon: 'Monitor', color: '#10B981', description: 'Desktop computers' },
    { name: 'Laptop', icon: 'Laptop', color: '#059669', description: 'Portable laptops' },
    { name: 'Fingerprint Device', icon: 'Fingerprint', color: '#F59E0B', description: 'Biometric fingerprint scanners' },
    { name: 'Camera', icon: 'Camera', color: '#F43F5E', description: 'Security cameras and CCTV' },
    { name: 'Firewall', icon: 'Shield', color: '#EF4444', description: 'Network firewalls' },
    { name: 'IP Phone', icon: 'Phone', color: '#14B8A6', description: 'VoIP IP phones' },
    { name: 'Access Point', icon: 'Wifi', color: '#7C3AED', description: 'Wireless access points' },
  ];
  for (const cat of categories) {
    await prisma.deviceCategory.upsert({ where: { name: cat.name }, update: {}, create: cat });
  }
  console.log('✅ Device categories created');

  // Branches
  const branches = await Promise.all([
    prisma.branch.upsert({ where: { name: 'Port Said HQ' }, update: {}, create: { name: 'Port Said HQ', address: 'Port Said West Port', city: 'Port Said' } }),
    prisma.branch.upsert({ where: { name: 'Cairo Office' }, update: {}, create: { name: 'Cairo Office', address: 'Nasr City', city: 'Cairo' } }),
    prisma.branch.upsert({ where: { name: 'Alexandria Branch' }, update: {}, create: { name: 'Alexandria Branch', address: 'Al Dekheila Port', city: 'Alexandria' } }),
    prisma.branch.upsert({ where: { name: 'East Port Said' }, update: {}, create: { name: 'East Port Said', address: 'East Port Said Port', city: 'Port Said' } }),
  ]);
  console.log('✅ Branches created');

  // Departments
  const deptNames = ['IT Department', 'Operations', 'Finance', 'HR', 'Security', 'Maintenance', 'Marine Operations', 'Container Terminal'];
  for (const name of deptNames) {
    await prisma.department.upsert({
      where: { id: `dept-${name.toLowerCase().replace(/\s/g, '-')}-${branches[0].id.slice(0, 8)}` },
      update: {},
      create: { name, branchId: branches[0].id },
    }).catch(() => prisma.department.create({ data: { name, branchId: branches[0].id } }).catch(() => {}));
  }
  console.log('✅ Departments created');

  // VLANs
  const vlans = [
    { vlanNumber: 10, name: 'Management', subnet: '10.10.10.0/24', gateway: '10.10.10.1', description: 'Network management VLAN' },
    { vlanNumber: 20, name: 'Servers', subnet: '10.10.20.0/24', gateway: '10.10.20.1', description: 'Server farm VLAN' },
    { vlanNumber: 30, name: 'Workstations', subnet: '10.10.30.0/24', gateway: '10.10.30.1', description: 'Employee workstations' },
    { vlanNumber: 40, name: 'VoIP', subnet: '10.10.40.0/24', gateway: '10.10.40.1', description: 'Voice over IP' },
    { vlanNumber: 50, name: 'Security', subnet: '10.10.50.0/24', gateway: '10.10.50.1', description: 'Cameras and access control' },
    { vlanNumber: 60, name: 'Guest', subnet: '10.10.60.0/24', gateway: '10.10.60.1', description: 'Guest WiFi network' },
    { vlanNumber: 100, name: 'DMZ', subnet: '10.10.100.0/24', gateway: '10.10.100.1', description: 'Demilitarized zone' },
  ];
  for (const v of vlans) {
    await prisma.vLAN.upsert({ where: { vlanNumber: v.vlanNumber }, update: {}, create: v });
  }
  console.log('✅ VLANs created');

  // Employees
  const employees = [
    { fullName: 'Ahmed Hassan', employeeCode: 'PS-1001', phone: '+20-101-234-5678', email: 'ahmed.hassan@pscchc.com' },
    { fullName: 'Mohamed Ali', employeeCode: 'PS-1002', phone: '+20-102-345-6789', email: 'mohamed.ali@pscchc.com' },
    { fullName: 'Sara Ibrahim', employeeCode: 'PS-1003', phone: '+20-103-456-7890', email: 'sara.ibrahim@pscchc.com' },
    { fullName: 'Khaled Mahmoud', employeeCode: 'PS-1004', phone: '+20-104-567-8901', email: 'khaled.mahmoud@pscchc.com' },
    { fullName: 'Fatma Nabil', employeeCode: 'PS-1005', phone: '+20-105-678-9012', email: 'fatma.nabil@pscchc.com' },
    { fullName: 'Omar Youssef', employeeCode: 'PS-1006', phone: '+20-106-789-0123', email: 'omar.youssef@pscchc.com' },
    { fullName: 'Nour Saeed', employeeCode: 'PS-1007', phone: '+20-107-890-1234', email: 'nour.saeed@pscchc.com' },
    { fullName: 'Tarek Adel', employeeCode: 'PS-1008', phone: '+20-108-901-2345', email: 'tarek.adel@pscchc.com' },
  ];
  for (const emp of employees) {
    await prisma.employee.upsert({ where: { employeeCode: emp.employeeCode }, update: {}, create: emp });
  }
  console.log('✅ Employees created');

  console.log('\n🎉 Database seeding completed!');
  console.log('   Login with: admin@pscchc.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
