import { Router, Request, Response } from 'express';
import { prisma, io } from '../index';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// GET /api/messages/conversations - list all conversation partners for current user
router.get('/conversations', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  try {
    // Get all unique conversations (partner + conversationId)
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { timestamp: 'desc' },
      include: {
        sender: { select: { userId: true, name: true, role: true } },
        receiver: { select: { userId: true, name: true, role: true } },
      }
    });

    // Group by conversationId, pick most recent message
    const convMap = new Map<string, any>();
    for (const msg of messages) {
      if (!convMap.has(msg.conversationId)) {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        convMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          partner,
          lastMessage: msg.messageText,
          lastTimestamp: msg.timestamp,
          unread: msg.receiverId === userId,
        });
      }
    }
    res.json(Array.from(convMap.values()));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load conversations' });
  }
});

// GET /api/messages/:conversationId - get all messages in a conversation
router.get('/:conversationId', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { conversationId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId as string },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: { select: { userId: true, name: true } },
      }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load messages' });
  }
});

// POST /api/messages - send a message
router.post('/', protect, async (req: Request, res: Response) => {
  const senderId = (req as any).user.userId;
  const { receiverId, messageText, conversationId } = req.body;
  if (!receiverId || !messageText) {
    return res.status(400).json({ message: 'receiverId and messageText required' });
  }
  try {
    // conversationId: deterministic based on the two user IDs so same convo is always found
    const convId = conversationId || [senderId, receiverId].sort().join('_');
    const message = await prisma.message.create({
      data: { conversationId: convId, senderId, receiverId, messageText },
      include: { 
        sender: { select: { userId: true, name: true, role: true } },
        receiver: { select: { userId: true, name: true, role: true } }
      }
    });
    
    // Broadcast real-time event to participants
    io.to([convId, senderId, receiverId]).emit('receive_message', message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// PUT /api/messages/status - update message statuses (DELIVERED, READ)
router.put('/status', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { messageIds, status } = req.body;
  if (!messageIds || !Array.isArray(messageIds) || !status) {
    return res.status(400).json({ message: 'messageIds array and status are required' });
  }

  try {
    // Update messages where the current user is the receiver
    // @ts-ignore - status field was recently added to schema
    const updated = await prisma.message.updateMany({
      where: {
        messageId: { in: messageIds },
        receiverId: userId,
      },
      data: { status }
    });

    if (updated.count > 0) {
      // Find the sender to broadcast the change
      const sampleMsg = await prisma.message.findFirst({
        where: { messageId: messageIds[0] }
      });
      if (sampleMsg) {
        // @ts-ignore
        io.to(sampleMsg.senderId).emit('message_status_update', { 
          messageIds, 
          status, 
          // @ts-ignore
          conversationId: sampleMsg.conversationId 
        });
      }
    }

    res.json({ updated: updated.count });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update message status' });
  }
});

export default router;
