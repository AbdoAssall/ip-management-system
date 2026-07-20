import { Router } from 'express';
import prisma from '../utils/prisma';
import { getClientIP, getParam } from '../utils/helpers';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getMonitorService } from '../services/deviceMonitor';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { category, status, branch, department, search, page = '1', limit = '50' } = req.query;
  const where: any = {};
  if (category) where.categoryId = String(category);
  if (status) where.status = String(status);
  if (branch) where.branchId = String(branch);
  if (department) where.departmentId = String(department);
  if (search) {
    const s = String(search);
    where.OR = [
      { deviceName: { contains: s, mode: 'insensitive' } },
      { assetTag: { contains: s, mode: 'insensitive' } },
      { hostname: { contains: s, mode: 'insensitive' } },
    ];
  }
  const [devices, total] = await Promise.all([
    prisma.device.findMany({ where, include: { category: true, branch: true, department: true, employee: true, ipAddresses: true }, orderBy: { createdAt: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
    prisma.device.count({ where }),
  ]);
  res.json({ devices, total, page: Number(page), limit: Number(limit) });
});

router.get('/stats', authenticate, async (_req, res) => {
  const [total, online, offline, maintenance] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: 'Online' } }),
    prisma.device.count({ where: { status: 'Offline' } }),
    prisma.device.count({ where: { status: 'Maintenance' } }),
  ]);
  const byCategory = await prisma.device.groupBy({ by: ['categoryId'], _count: true });
  const categories = await prisma.deviceCategory.findMany();
  const categoryCounts = byCategory.map((g) => {
    const cat = categories.find((c) => c.id === g.categoryId);
    return { name: cat?.name, count: g._count, color: cat?.color };
  });
  res.json({ total, online, offline, maintenance, byCategory: categoryCounts });
});

router.get('/:id', authenticate, async (req, res) => {
  const id = getParam(req, 'id');
  const device = await prisma.device.findUnique({ where: { id }, include: { category: true, branch: true, department: true, employee: true, ipAddresses: true, maintenanceRecords: true, warrantyRecords: true } });
  if (!device) { res.status(404).json({ error: 'Device not found' }); return; }
  res.json(device);
});

// Helper: extract only valid Device model fields from request body
function sanitizeDeviceData(body: any) {
  const { ipAddress, vlanId, locationId, category, location, department, branch, employee, ...rest } = body;
  // Convert empty strings to null for optional date fields and optional string fields
  const optionalDateFields = ['purchaseDate', 'warrantyExpiration', 'lastMaintenance'];
  const optionalStringFields = ['employeeId', 'branchId', 'departmentId', 'macAddress', 'notes', 'floor', 'room', 'building', 'dns', 'subnetMask', 'defaultGateway'];
  for (const field of optionalDateFields) {
    if (rest[field] === '' || rest[field] === null) {
      rest[field] = null;
    } else if (rest[field]) {
      rest[field] = new Date(rest[field]);
    }
  }
  for (const field of optionalStringFields) {
    if (rest[field] === '') {
      rest[field] = null;
    }
  }
  return { deviceData: rest, ipAddress, vlanId };
}

router.post('/', authenticate, authorize('Admin', 'IT Manager', 'IT Support'), async (req: AuthRequest, res) => {
  try {
    const { deviceData, ipAddress, vlanId } = sanitizeDeviceData(req.body);
    const device = await prisma.device.create({ data: { ...deviceData, createdBy: req.userId }, include: { category: true, ipAddresses: true } });

    // If IP address was provided, create an IPAddress record linked to this device
    if (ipAddress) {
      await prisma.iPAddress.create({
        data: {
          ipAddress,
          deviceId: device.id,
          vlanId: vlanId || null,
          status: 'Assigned',
          type: 'IPv4',
        },
      });
    }

    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'CREATE', entityType: 'Device', entityId: device.id, newValue: { deviceName: device.deviceName, assetTag: device.assetTag } as any, ipAddressSource: getClientIP(req) } });

    // Re-fetch with IP addresses included
    const full = await prisma.device.findUnique({ where: { id: device.id }, include: { category: true, ipAddresses: true } });

    // Notify monitor of new device
    const monitor = getMonitorService();
    if (monitor) monitor.onDeviceChanged(device.id);

    res.status(201).json(full);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create device', message: (err as Error).message });
  }
});

router.put('/:id', authenticate, authorize('Admin', 'IT Manager', 'IT Support'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    const { deviceData, ipAddress, vlanId } = sanitizeDeviceData(req.body);
    const prev = await prisma.device.findUnique({ where: { id }, include: { ipAddresses: true } });
    const device = await prisma.device.update({ where: { id }, data: deviceData, include: { category: true, ipAddresses: true } });

    // Update or create the IP address record for this device
    if (ipAddress) {
      const existingIP = prev?.ipAddresses?.[0];
      if (existingIP) {
        await prisma.iPAddress.update({
          where: { id: existingIP.id },
          data: { ipAddress, vlanId: vlanId || null },
        });
      } else {
        await prisma.iPAddress.create({
          data: {
            ipAddress,
            deviceId: device.id,
            vlanId: vlanId || null,
            status: 'Assigned',
            type: 'IPv4',
          },
        });
      }
    }

    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'UPDATE', entityType: 'Device', entityId: device.id, previousValue: prev ? { status: prev.status, deviceName: prev.deviceName } as any : undefined, newValue: { status: device.status, deviceName: device.deviceName } as any, ipAddressSource: getClientIP(req) } });

    // Re-fetch with updated IPs
    const full = await prisma.device.findUnique({ where: { id: device.id }, include: { category: true, ipAddresses: true } });

    // Notify monitor of device change (IP or status may have changed)
    const monitor = getMonitorService();
    if (monitor) monitor.onDeviceChanged(device.id);

    res.json(full);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update device', message: (err as Error).message });
  }
});

router.delete('/:id', authenticate, authorize('Admin', 'IT Manager'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.device.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'DELETE', entityType: 'Device', entityId: id, ipAddressSource: getClientIP(req) } });

    // Notify monitor of device deletion
    const monitor = getMonitorService();
    if (monitor) monitor.onDeviceDeleted(id);

    res.json({ message: 'Device deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete device' });
  }
});

export default router;
