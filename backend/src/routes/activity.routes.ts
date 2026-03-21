import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/activity/logout - Record a logout event
router.post('/logout', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const ipAddress = req.ip || req.connection.remoteAddress || null;

  try {
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'LOGOUT',
        ipAddress: ipAddress as string | null
      }
    });

    res.json({ message: 'Logout activity recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record logout' });
  }
});

export default router;
