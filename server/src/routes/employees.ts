import { Router } from 'express';
import prisma from '../utils/prisma';
import { getParam } from '../utils/helpers';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  res.json(await prisma.employee.findMany({ include: { department: true }, orderBy: { fullName: 'asc' } }));
});

router.post('/', authenticate, async (req, res) => {
  try {
    res.status(201).json(await prisma.employee.create({ data: req.body }));
  } catch {
    res.status(400).json({ error: 'Failed to create employee' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = getParam(req, 'id');
    await prisma.employee.delete({ where: { id } });
    res.json({ message: 'Employee deleted' });
  } catch {
    res.status(400).json({ error: 'Cannot delete employee' });
  }
});

export default router;
