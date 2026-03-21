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

// PUBLIC: GET /api/blogs - List all blogs
router.get('/', async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

// PUBLIC: GET /api/blogs/:id - Get a single blog
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { id: req.params.id as string } });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
});

// ADMIN: POST /api/blogs - Create a blog
router.post('/', protect, adminOnly, async (req: Request, res: Response) => {
  const { title, excerpt, category, body } = req.body;
  try {
    const blog = await prisma.blog.create({
      data: { title, excerpt, category, body }
    });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create blog' });
  }
});

// ADMIN: PUT /api/blogs/:id - Update a blog
router.put('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  const { title, excerpt, category, body } = req.body;
  try {
    const blog = await prisma.blog.update({
      where: { id: req.params.id as string },
      data: { title, excerpt, category, body }
    });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update blog' });
  }
});

// ADMIN: DELETE /api/blogs/:id - Delete a blog
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete blog' });
  }
});

export default router;
