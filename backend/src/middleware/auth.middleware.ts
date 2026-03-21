import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface JwtPayload {
  id: string;
  role: string;
}

// Extend Express Request object to include user object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
      ) as JwtPayload;

      // Get user from the token but exclude password
      req.user = await prisma.user.findUnique({
        where: { userId: decoded.id },
        select: {
          userId: true,
          name: true,
          email: true,
          role: true,
          status: true,
        }
      });

      if (!req.user) {
         res.status(401).json({ message: 'Not authorized, user not found' });
         return;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

// Admin middleware
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Worker middleware
export const worker = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'WORKER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a worker' });
  }
};
