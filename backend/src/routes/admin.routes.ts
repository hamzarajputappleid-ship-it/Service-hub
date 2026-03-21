import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Admin guard middleware
const adminOnly = (req: Request, res: Response, next: any) => {
  if ((req as any).user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const getGrowth = async (modelDelegate: any, whereClause: any = {}) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriod = await modelDelegate.count({
    where: { ...whereClause, createdAt: { gte: thirtyDaysAgo } }
  });

  const previousPeriod = await modelDelegate.count({
    where: { ...whereClause, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
  });

  if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
  return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
};

// GET /api/admin/stats - platform-wide stats
router.get('/stats', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkers, totalBookings, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.workerProfile.count(),
      prisma.booking.count(),
      prisma.message.count(),
    ]);

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    const [usersGrowth, workersGrowth, bookingsGrowth, completedJobsGrowth] = await Promise.all([
      getGrowth(prisma.user),
      getGrowth(prisma.user, { role: 'WORKER' }),
      getGrowth(prisma.booking),
      getGrowth(prisma.booking, { status: 'COMPLETED' })
    ]);

    res.json({
      totalUsers,
      totalWorkers,
      totalBookings,
      totalMessages,
      bookingsByStatus,
      growthRates: {
        users: usersGrowth,
        workers: workersGrowth,
        bookings: bookingsGrowth,
        completedJobs: completedJobsGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// GET /api/admin/users - list all users
router.get('/users', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true, name: true, email: true, role: true, status: true, createdAt: true, lastActiveAt: true,
        workerProfile: { select: { serviceCategory: true, ratingAverage: true } },
        _count: { select: { bookingsAsCust: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/status - change user status (ACTIVE/SUSPENDED)
router.patch('/users/:id/status', protect, adminOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const user = await prisma.user.update({
      where: { userId: id as string },
      data: { status },
      select: { userId: true, name: true, status: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// GET /api/admin/bookings - list all bookings
router.get('/bookings', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        worker: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

// GET /api/admin/activity - Retrieve comprehensive login/logout activity logs
router.get('/activity', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.userActivity.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load activity logs' });
  }
});

// GET /api/admin/payments - Retrieve all platform payments
router.get('/payments', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { 
        booking: { 
          select: { 
            customer: { select: { name: true, email: true } },
            worker: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load payments' });
  }
});

export default router;
