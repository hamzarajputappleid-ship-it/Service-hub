import { Router, Request, Response } from 'express';
import { prisma } from '../index';
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
    const categories = await prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// ADMIN: POST /api/categories
router.post('/', protect, adminOnly, async (req: Request, res: Response) => {
  const { name, description, icon } = req.body;
  try {
    const category = await prisma.serviceCategory.create({
      data: { name, description, icon }
    });
    res.status(201).json(category);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Category name already exists' });
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// ADMIN: PUT /api/categories/:id
router.put('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  const { name, description, icon } = req.body;
  try {
    const category = await prisma.serviceCategory.update({
      where: { id: req.params.id as string },
      data: { name, description, icon }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// ADMIN: DELETE /api/categories/:id
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await prisma.serviceCategory.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;
