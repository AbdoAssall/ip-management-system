import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  const vlans = await prisma.vLAN.findMany({ include: { _count: { select: { ipAddresses: true } } }, orderBy: { vlanNumber: 'asc' } });
  res.json(vlans);
});

router.post('/', authenticate, authorize('Admin', 'IT Manager'), async (req, res) => {
  try {
    const vlan = await prisma.vLAN.create({ data: req.body });
    res.status(201).json(vlan);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create VLAN', message: (err as Error).message });
  }
});

router.put('/:id', authenticate, authorize('Admin', 'IT Manager'), async (req, res) => {
  try {
    const id = getParam(req, 'id');
    const vlan = await prisma.vLAN.update({ where: { id }, data: req.body });
    res.json(vlan);
  } catch {
    res.status(400).json({ error: 'Failed to update VLAN' });
  }
});

router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.vLAN.delete({ where: { id } });
    res.json({ message: 'VLAN deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete VLAN' });
  }
});

export default router;
