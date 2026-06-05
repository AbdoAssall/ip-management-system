import { Router } from 'express';
import prisma from '../utils/prisma';
import { getClientIP, getParam } from '../utils/helpers';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { status, vlan, search } = req.query;
  const where: any = {};
  if (status) where.status = String(status);
  if (vlan) where.vlanId = String(vlan);
  if (search) where.ipAddress = { contains: String(search) };
  const ips = await prisma.iPAddress.findMany({ where, include: { device: true, vlan: true }, orderBy: { ipAddress: 'asc' } });
  res.json(ips);
});

router.get('/duplicates', authenticate, async (_req, res) => {
  const ips = await prisma.iPAddress.findMany({ include: { device: true } });
  const seen = new Map<string, any[]>();
  ips.forEach((ip) => {
    if (!seen.has(ip.ipAddress)) seen.set(ip.ipAddress, []);
    seen.get(ip.ipAddress)!.push(ip);
  });
  const duplicates = Array.from(seen.entries()).filter(([, arr]) => arr.length > 1).map(([ip, entries]) => ({ ip, entries }));
  res.json(duplicates);
});

router.get('/available', authenticate, async (req, res) => {
  const { ip } = req.query;
  if (!ip) { res.status(400).json({ error: 'IP parameter required' }); return; }
  const found = await prisma.iPAddress.findFirst({ where: { ipAddress: String(ip) }, include: { device: true } });
  res.json({ ip, available: !found, existing: found || null });
});

router.post('/', authenticate, authorize('Admin', 'IT Manager', 'IT Support'), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.iPAddress.findFirst({ where: { ipAddress: req.body.ipAddress, vlanId: req.body.vlanId } });
    const ip = await prisma.iPAddress.create({ data: { ...req.body, status: existing ? 'Duplicate' : req.body.status || 'Available' } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'CREATE', entityType: 'IP Address', entityId: ip.id, newValue: { ipAddress: ip.ipAddress } as any, ipAddressSource: getClientIP(req) } });
    res.status(201).json(ip);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add IP', message: (err as Error).message });
  }
});

router.put('/:id', authenticate, authorize('Admin', 'IT Manager', 'IT Support'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    const prev = await prisma.iPAddress.findUnique({ where: { id } });
    const ip = await prisma.iPAddress.update({ where: { id }, data: req.body });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'IP_CHANGE', entityType: 'IP Address', entityId: ip.id, previousValue: prev ? { ipAddress: prev.ipAddress, status: prev.status } as any : undefined, newValue: { ipAddress: ip.ipAddress, status: ip.status } as any, ipAddressSource: getClientIP(req) } });
    res.json(ip);
  } catch {
    res.status(400).json({ error: 'Failed to update IP' });
  }
});

router.delete('/:id', authenticate, authorize('Admin', 'IT Manager'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.iPAddress.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'DELETE', entityType: 'IP Address', entityId: id, ipAddressSource: getClientIP(req) } });
    res.json({ message: 'IP deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete IP' });
  }
});

export default router;
