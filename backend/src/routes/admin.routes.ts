import { Router, Request, Response } from 'express';
import { User } from '../models/User.model';
import { WorkerProfile } from '../models/WorkerProfile.model';
import { Booking } from '../models/Booking.model';
import { Message } from '../models/Message.model';
import { UserActivity } from '../models/UserActivity.model';
import { Payment } from '../models/Payment.model';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Admin guard middleware
const adminOnly = (req: Request, res: Response, next: any) => {
  if ((req as any).user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const getGrowth = async (Model: any, whereClause: any = {}) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriod = await Model.countDocuments({
    ...whereClause, createdAt: { $gte: thirtyDaysAgo }
  });

  const previousPeriod = await Model.countDocuments({
    ...whereClause, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
  });

  if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
  return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
};

// GET /api/admin/stats - platform-wide stats
router.get('/stats', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkers, totalBookings, totalMessages] = await Promise.all([
      User.countDocuments(),
      WorkerProfile.countDocuments(),
      Booking.countDocuments(),
      Message.countDocuments(),
    ]);

    const bookingsByStatusAgg = await Booking.aggregate([
      { $group: { _id: "$status", _count: { $sum: 1 } } },
    ]);
    const bookingsByStatus = bookingsByStatusAgg.map(i => ({ status: i._id, _count: i._count }));

    const [usersGrowth, workersGrowth, bookingsGrowth, completedJobsGrowth] = await Promise.all([
      getGrowth(User),
      getGrowth(User, { role: 'WORKER' }),
      getGrowth(Booking),
      getGrowth(Booking, { status: 'COMPLETED' })
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
    const usersRaw = await User.find({}).sort({ createdAt: -1 }).lean();
    
    // Map worker profiles
    const workerProfiles = await WorkerProfile.find({}).lean();
    const workerMap = new Map(workerProfiles.map(w => [w.userId, w]));

    // Get booking counts
    const bookingsCountAgg = await Booking.aggregate([
      { $group: { _id: "$customerId", count: { $sum: 1 } } }
    ]);
    const bookingCountMap = new Map(bookingsCountAgg.map(b => [b._id, b.count]));

    const users = usersRaw.map(u => ({
      userId: u.userId, 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      status: u.status, 
      createdAt: u.createdAt, 
      lastActiveAt: u.lastActiveAt,
      workerProfile: workerMap.has(u.userId) ? {
        serviceCategory: workerMap.get(u.userId)?.serviceCategory,
        ratingAverage: workerMap.get(u.userId)?.ratingAverage
      } : null,
      _count: { bookingsAsCust: bookingCountMap.get(u.userId) || 0 }
    }));
    
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
    const user = await User.findOneAndUpdate(
      { userId: id as string },
      { status },
      { new: true }
    ).select('userId name status');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// GET /api/admin/bookings - list all bookings
router.get('/bookings', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const bookingsRaw = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
      
    const customerIds = bookingsRaw.map(b => b.customerId);
    const workerIds = bookingsRaw.map(b => b.workerId);
    
    const customers = await User.find({ userId: { $in: customerIds } }, 'userId name email').lean();
    const workers = await User.find({ userId: { $in: workerIds } }, 'userId name email').lean();
    
    const customerMap = new Map(customers.map(c => [c.userId, c]));
    const workerMap = new Map(workers.map(w => [w.userId, w]));

    const bookings = bookingsRaw.map(b => ({
      ...b,
      customer: customerMap.get(b.customerId),
      worker: workerMap.get(b.workerId)
    }));
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

// GET /api/admin/activity - Retrieve comprehensive login/logout activity logs
router.get('/activity', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const logsRaw = await UserActivity.find({})
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();
      
    const userIds = logsRaw.map(l => l.userId);
    const users = await User.find({ userId: { $in: userIds } }, 'userId name email role').lean();
    const userMap = new Map(users.map(u => [u.userId, u]));

    const logs = logsRaw.map(l => ({
      ...l,
      user: userMap.get(l.userId)
    }));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load activity logs' });
  }
});

// GET /api/admin/payments - Retrieve all platform payments
router.get('/payments', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const paymentsRaw = await Payment.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
      
    const bookingIds = paymentsRaw.map(p => p.bookingId);
    const bookings = await Booking.find({ bookingId: { $in: bookingIds } }, 'bookingId customerId workerId').lean();
    const bookingMap = new Map(bookings.map(b => [b.bookingId, b]));
    
    const customerIds = bookings.map(b => b.customerId);
    const workerIds = bookings.map(b => b.workerId);
    
    const users = await User.find({ userId: { $in: [...customerIds, ...workerIds] } }, 'userId name email').lean();
    const userMap = new Map(users.map(u => [u.userId, u]));

    const payments = paymentsRaw.map(p => {
      const b = bookingMap.get(p.bookingId);
      return {
        ...p,
        booking: b ? {
          customer: userMap.get(b.customerId),
          worker: userMap.get(b.workerId)
        } : null
      };
    });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load payments' });
  }
});

export default router;
