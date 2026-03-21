import { Request, Response } from 'express';
import { prisma } from '../index';

// @desc    Get current worker's profile
// @route   GET /api/workers/profile
// @access  Private/Worker
export const getWorkerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: { select: { name: true, email: true, phone: true } }
      }
    });

    if (workerProfile) {
      res.json(workerProfile);
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

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (workerProfile) {
      const updatedProfile = await prisma.workerProfile.update({
        where: { userId: req.user.userId },
        data: {
          serviceCategory: serviceCategory || workerProfile.serviceCategory,
          skills: skills !== undefined ? skills : workerProfile.skills,
          pricing: pricing !== undefined ? pricing : workerProfile.pricing,
          serviceArea: serviceArea !== undefined ? serviceArea : workerProfile.serviceArea,
          availability: availability !== undefined ? availability : workerProfile.availability,
          portfolio: portfolio !== undefined ? portfolio : workerProfile.portfolio,
        },
      });

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
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { workerId: String(req.params.id) },
      include: {
        user: { select: { name: true, email: true, phone: true } }
      }
    });

    if (workerProfile) {
      res.json(workerProfile);
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

    const workers = await prisma.workerProfile.findMany({
      where: query,
      include: {
        user: { select: { name: true, email: true, status: true } }
      }
    });

    res.json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching workers' });
  }
};
