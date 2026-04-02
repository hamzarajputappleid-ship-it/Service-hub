import { Router, Request, Response } from 'express';
import { UserActivity } from '../models/UserActivity.model';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/activity/logout - Record a logout event
router.post('/logout', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;

  try {
    await UserActivity.create({
      userId,
      action: 'LOGOUT',
      ipAddress: ipAddress
    });

    res.json({ message: 'Logout activity recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record logout' });
  }
});

export default router;
