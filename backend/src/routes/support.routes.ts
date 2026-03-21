import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/support/report — submit a support ticket
router.post('/report', async (req: Request, res: Response) => {
  const { type, subject, description, userId } = req.body;
  if (!type || !subject || !description) {
    return res.status(400).json({ message: 'type, subject, and description are required' });
  }
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        type,
        subject,
        description,
        userId: userId || null,
        status: 'OPEN',
      }
    });
    res.status(201).json({
      message: 'Ticket submitted successfully',
      ticketId: ticket.id,
      ticket,
    });
  } catch (error) {
    console.error('Support ticket error:', error);
    res.status(500).json({ message: 'Failed to submit ticket' });
  }
});

// GET /api/support/tickets — admin can view all tickets
router.get('/tickets', protect, async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load tickets' });
  }
});

export default router;
