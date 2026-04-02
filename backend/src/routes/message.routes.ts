import { Router, Request, Response } from 'express';
import { Message } from '../models/Message.model';
import { User } from '../models/User.model';
import { io } from '../index';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// GET /api/messages/conversations - list all conversation partners for current user
router.get('/conversations', protect, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  try {
    // Get all unique conversations (partner + conversationId)
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ timestamp: -1 }).lean();

    const userIds = [...new Set([
      ...messages.map(m => m.senderId),
      ...messages.map(m => m.receiverId)
    ])];
    
    const users = await User.find({ userId: { $in: userIds } }, 'userId name role').lean();
    const userMap = new Map(users.map(u => [u.userId, u]));

    // Group by conversationId, pick most recent message
    const convMap = new Map<string, any>();
    for (const msg of messages) {
      if (!convMap.has(msg.conversationId)) {
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        const partner = userMap.get(partnerId);
        
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
  const { conversationId } = req.params;
  try {
    const messages = await Message.find({ conversationId: conversationId as string })
      .sort({ timestamp: 1 })
      .lean();
      
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await User.find({ userId: { $in: senderIds } }, 'userId name').lean();
    const senderMap = new Map(senders.map(s => [s.userId, s]));
    
    const messagesWithSenders = messages.map(m => ({
      ...m,
      sender: senderMap.get(m.senderId)
    }));
      
    res.json(messagesWithSenders);
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
    const messageRaw = await Message.create({ conversationId: convId, senderId, receiverId, messageText });
    
    const sender = await User.findOne({ userId: senderId }, 'userId name role').lean();
    const receiver = await User.findOne({ userId: receiverId }, 'userId name role').lean();
    
    const message = { ...messageRaw.toObject(), sender, receiver };
    
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
    const updated = await Message.updateMany(
      { messageId: { $in: messageIds }, receiverId: userId },
      { $set: { status } }
    );

    if (updated.modifiedCount > 0) {
      // Find the sender to broadcast the change
      const sampleMsg = await Message.findOne({ messageId: messageIds[0] }).lean();
      if (sampleMsg) {
        io.to(sampleMsg.senderId).emit('message_status_update', { 
          messageIds, 
          status, 
          conversationId: sampleMsg.conversationId 
        });
      }
    }

    res.json({ updated: updated.modifiedCount });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update message status' });
  }
});

export default router;
