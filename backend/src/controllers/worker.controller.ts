import { Request, Response } from 'express';
import { WorkerProfile } from '../models/WorkerProfile.model';
import { User } from '../models/User.model';

// @desc    Get current worker's profile
// @route   GET /api/workers/profile
// @access  Private/Worker
export const getWorkerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const workerProfile = await WorkerProfile.findOne({ userId: req.user.userId }).lean();
    
    if (workerProfile) {
      const user = await User.findOne({ userId: workerProfile.userId }, 'name email phone').lean();
      res.json({ ...workerProfile, user });
    } else {
      res.status(404).json({ message: 'Worker profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving worker profile' });
  }
};

// @desc    Update current worker's profile
// @route   PUT /api/workers/profile
// @access  Private/Worker
export const updateWorkerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceCategory, skills, pricing, serviceArea, availability, portfolio } = req.body;

    const workerProfile = await WorkerProfile.findOne({ userId: req.user.userId });

    if (workerProfile) {
      const updatedProfile = await WorkerProfile.findOneAndUpdate(
        { userId: req.user.userId },
        {
          serviceCategory: serviceCategory || workerProfile.serviceCategory,
          skills: skills !== undefined ? skills : workerProfile.skills,
          pricing: pricing !== undefined ? pricing : workerProfile.pricing,
          serviceArea: serviceArea !== undefined ? serviceArea : workerProfile.serviceArea,
          availability: availability !== undefined ? availability : workerProfile.availability,
          portfolio: portfolio !== undefined ? portfolio : workerProfile.portfolio,
        },
        { new: true }
      );

      res.json(updatedProfile);
    } else {
      res.status(404).json({ message: 'Worker profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating worker profile' });
  }
};

// @desc    Get worker profile by ID
// @route   GET /api/workers/:id
// @access  Public
export const getWorkerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const workerProfile = await WorkerProfile.findOne({ workerId: String(req.params.id) }).lean();

    if (workerProfile) {
      const user = await User.findOne({ userId: workerProfile.userId }, 'name email phone').lean();
      res.json({ ...workerProfile, user });
    } else {
      res.status(404).json({ message: 'Worker profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving worker profile' });
  }
};

// @desc    Get all workers (filterable by category)
// @route   GET /api/workers
// @access  Public
export const getAllWorkers = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryRaw = req.query.category;
    const category = Array.isArray(categoryRaw) ? String(categoryRaw[0]) : (categoryRaw as string | undefined);
    
    // Build query conditionally based on provided filters
    const query: any = {};
    if (category) {
      query.serviceCategory = category;
    }

    const workers = await WorkerProfile.find(query).lean();
    
    const userIds = workers.map(w => w.userId);
    const users = await User.find({ userId: { $in: userIds } }, 'userId name email status').lean();
    const userMap = new Map(users.map(u => [u.userId, u]));
    
    const workersWithUsers = workers.map(w => ({
      ...w,
      user: userMap.get(w.userId)
    }));

    res.json(workersWithUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching workers' });
  }
};
