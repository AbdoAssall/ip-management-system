import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  res.json(await prisma.branch.findMany({ orderBy: { name: 'asc' } }));
});

router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    res.status(201).json(await prisma.branch.create({ data: req.body }));
  } catch {
    res.status(400).json({ error: 'Failed to create branch' });
  }
});

router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const id = getParam(req, 'id');
    res.json(await prisma.branch.update({ where: { id }, data: req.body }));
  } catch {
    res.status(400).json({ error: 'Failed to update branch' });
  }
});

router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.branch.delete({ where: { id } });
    res.json({ message: 'Branch deleted' });
  } catch {
    res.status(400).json({ error: 'Cannot delete branch with associated records' });
  }
});

export default router;
