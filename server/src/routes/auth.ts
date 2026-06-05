import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { getClientIP } from '../utils/helpers';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      secret,
      { expiresIn: 86400 } // 24 hours in seconds
    );

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id, ipAddressSource: getClientIP(req) },
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, lastLogin: new Date() },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: (err as Error).message });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.auditLog.create({
      data: { userId: req.userId!, action: 'LOGOUT', entityType: 'User', entityId: req.userId!, ipAddressSource: getClientIP(req) },
    });
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.post('/reset-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: hash } });

    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export default router;
