import { Request, Response } from 'express';
import { prisma } from '../index';

// @desc    Get all unique service categories
// @route   GET /api/discovery/categories
// @access  Public
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoriesList = await prisma.workerProfile.findMany({
      select: {
        serviceCategory: true,
      },
      distinct: ['serviceCategory'],
    });

    const categories = categoriesList.map((c: any) => c.serviceCategory);
    
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
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { workerId: String(req.params.id) },
      include: {
        user: { 
          select: { name: true, email: true, status: true, createdAt: true } 
        }
      }
    });

    if (workerProfile) {
      res.json(workerProfile);
    } else {
      res.status(404).json({ message: 'Worker not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving worker details' });
  }
};
