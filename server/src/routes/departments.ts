import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  res.json(await prisma.department.findMany({ include: { branch: true }, orderBy: { name: 'asc' } }));
});

router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    res.status(201).json(await prisma.department.create({ data: req.body }));
  } catch {
    res.status(400).json({ error: 'Failed to create department' });
  }
});

router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted' });
  } catch {
    res.status(400).json({ error: 'Cannot delete department with associated records' });
  }
});

export default router;
