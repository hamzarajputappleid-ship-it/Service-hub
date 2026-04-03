import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Google DNS to fix Atlas SRV lookup issues on this network
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { createServer } from 'http';
import { Server as SocketIO, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db';

import authRoutes from './routes/auth.routes';
import adminAuthRoutes from './routes/adminAuth.routes';
import userRoutes from './routes/user.routes';
import workerRoutes from './routes/worker.routes';
import discoveryRoutes from './routes/discovery.routes';
import bookingRoutes from './routes/booking.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import supportRoutes from './routes/support.routes';
import chatbotRoutes from './routes/chatbot.routes';
import activityRoutes from './routes/activity.routes';
import blogRoutes from './routes/blog.routes';
import categoryRoutes from './routes/category.routes';
import ratingRoutes from './routes/rating.routes';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// Socket.IO — real-time messaging
export const io = new SocketIO(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

interface AuthSocket extends Socket {
  userId?: string;
}

io.use((socket: AuthSocket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    require('fs').appendFileSync('error.log', `[backend] Auth failed: no token provided\n`);
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    socket.userId = decoded.userId;
    next();
  } catch (err: any) {
    require('fs').appendFileSync('error.log', `[backend] Auth failed: invalid token (${err.message})\n`);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket: AuthSocket) => {
  const userId = socket.userId;
  if (!userId) {
    require('fs').appendFileSync('error.log', `[backend] Connection rejected: no userId on socket\n`);
    socket.disconnect();
    return;
  }

  require('fs').appendFileSync('error.log', `[backend] SOCKET CONNECTED: user ${userId}\n`);
  console.log(`Socket connected: user ${userId}`);
  
  // Join personal room for targeted messages
  socket.join(userId);

  // Join a specific conversation room
  socket.on('join_room', (conversationId: string) => {
    socket.join(conversationId);
  });

  // Real-time message sending is now handled by the POST /api/messages route
  // The socket remains connected to receive 'receive_message' events pushed from the API.

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: user ${userId}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ratings', ratingRoutes);

// Cloudinary image upload route
import { upload } from './config/cloudinary';
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  res.status(200).json({ imageUrl: req.file.path });
});

// Basic health check routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Service Hub API is running' });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Service Hub Backend is Live on Vercel!');
});

// Start server locally only if not in production
if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port} with Socket.IO`);
  });
}

// Export for Vercel
export default app;
