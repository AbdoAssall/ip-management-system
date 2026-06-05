import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  const categories = await prisma.deviceCategory.findMany({ include: { _count: { select: { devices: true } } } });
  res.json(categories);
});

export default router;
