import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId: req.userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

router.put('/:id/read', authenticate, async (req, res) => {
  const id = getParam(req, 'id');
  const notif = await prisma.notification.update({ where: { id }, data: { isRead: true } });
  res.json(notif);
});

router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { OR: [{ userId: req.userId }, { userId: null }], isRead: false },
    data: { isRead: true },
  });
  res.json({ message: 'All marked as read' });
});

router.delete('/:id', authenticate, async (req, res) => {
  const id = getParam(req, 'id');
  await prisma.notification.delete({ where: { id } });
  res.json({ message: 'Deleted' });
});

export default router;
