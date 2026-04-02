import { Router, Request, Response } from 'express';
import { ServiceCategory } from '../models/ServiceCategory.model';
import { protect } from '../middleware/auth.middleware';

const router = Router();

const adminOnly = (req: Request, res: Response, next: any) => {
  if ((req as any).user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// PUBLIC: GET /api/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await ServiceCategory.find({}).sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// ADMIN: POST /api/categories
router.post('/', protect, adminOnly, async (req: Request, res: Response) => {
  const { name, description, icon } = req.body;
  try {
    const category = await ServiceCategory.create({ name, description, icon });
    res.status(201).json(category);
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ message: 'Category name already exists' });
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// ADMIN: PUT /api/categories/:id
router.put('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  const { name, description, icon } = req.body;
  try {
    const category = await ServiceCategory.findOneAndUpdate(
      { id: req.params.id as string },
      { name, description, icon },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// ADMIN: DELETE /api/categories/:id
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await ServiceCategory.findOneAndDelete({ id: req.params.id as string });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;
