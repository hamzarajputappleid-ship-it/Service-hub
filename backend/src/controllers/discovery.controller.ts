import { Request, Response } from 'express';
import { WorkerProfile } from '../models/WorkerProfile.model';
import { User } from '../models/User.model';

// @desc    Get all unique service categories
// @route   GET /api/discovery/categories
// @access  Public
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await WorkerProfile.distinct('serviceCategory');
    // Filter out potential nulls or empty strings
    res.json(categories.filter((c: string) => c && c.trim() !== ''));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving categories' });
  }
};

// @desc    Get detailed public profile of a specific worker
// @route   GET /api/discovery/worker/:id
// @access  Public
export const getWorkerDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const workerProfile = await WorkerProfile.findOne({ workerId: String(req.params.id) }).lean();

    if (workerProfile) {
      const user = await User.findOne(
        { userId: workerProfile.userId },
        'name email status createdAt'
      ).lean();
      
      res.json({ ...workerProfile, user });
    } else {
      res.status(404).json({ message: 'Worker not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving worker details' });
  }
};
