import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { getClientIP, getParam } from '../utils/helpers';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: 'desc' } });
  res.json(users.map(({ passwordHash, ...u }) => u));
});

router.post('/', authenticate, authorize('Admin'), async (req: AuthRequest, res) => {
  try {
    const { username, email, password, fullName, roleId } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { username, email, passwordHash: hash, fullName, roleId }, include: { role: true } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'CREATE', entityType: 'User', entityId: user.id, newValue: { username, email, fullName } as any, ipAddressSource: getClientIP(req) } });
    const { passwordHash, ...result } = user;
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create user', message: (err as Error).message });
  }
});

router.put('/:id', authenticate, authorize('Admin'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    const { fullName, email, roleId, isActive } = req.body;
    const prev = await prisma.user.findUnique({ where: { id } });
    const user = await prisma.user.update({ where: { id }, data: { fullName, email, roleId, isActive }, include: { role: true } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'UPDATE', entityType: 'User', entityId: user.id, previousValue: prev ? { fullName: prev.fullName, email: prev.email } as any : undefined, newValue: { fullName, email } as any, ipAddressSource: getClientIP(req) } });
    const { passwordHash, ...result } = user;
    res.json(result);
  } catch {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', authenticate, authorize('Admin'), async (req: AuthRequest, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.user.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: req.userId!, action: 'DELETE', entityType: 'User', entityId: id, ipAddressSource: getClientIP(req) } });
    res.json({ message: 'User deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;
