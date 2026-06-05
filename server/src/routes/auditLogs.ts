import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { action, entityType, userId, page = '1', limit = '50' } = req.query;
  const where: any = {};
  if (action) where.action = String(action);
  if (entityType) where.entityType = String(entityType);
  if (userId) where.userId = String(userId);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { fullName: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ logs, total, page: Number(page), limit: Number(limit) });
});

export default router;
