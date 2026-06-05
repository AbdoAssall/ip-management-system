import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:type', authenticate, async (req, res) => {
  const type = getParam(req, 'type');
  try {
    switch (type) {
      case 'inventory': {
        const devices = await prisma.device.findMany({ include: { category: true, branch: true, department: true, employee: true } });
        res.json({ type: 'Device Inventory', data: devices, generatedAt: new Date() });
        break;
      }
      case 'ip': {
        const ips = await prisma.iPAddress.findMany({ include: { device: true, vlan: true } });
        res.json({ type: 'IP Address Report', data: ips, generatedAt: new Date() });
        break;
      }
      case 'warranty': {
        const devices = await prisma.device.findMany({ where: { warrantyExpiration: { not: null } }, orderBy: { warrantyExpiration: 'asc' }, include: { category: true } });
        res.json({ type: 'Warranty Report', data: devices, generatedAt: new Date() });
        break;
      }
      case 'maintenance': {
        const records = await prisma.maintenanceRecord.findMany({ include: { device: true }, orderBy: { scheduledDate: 'desc' } });
        res.json({ type: 'Maintenance Report', data: records, generatedAt: new Date() });
        break;
      }
      case 'category': {
        const categories = await prisma.deviceCategory.findMany({ include: { _count: { select: { devices: true } }, devices: { select: { status: true } } } });
        res.json({ type: 'Category Report', data: categories, generatedAt: new Date() });
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid report type' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Report generation failed', message: (err as Error).message });
  }
});

export default router;
