import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { UserActivity } from '../models/UserActivity.model';
import { generateToken } from '../utils/generateToken';

// @desc    Register a new admin
// @route   POST /api/admin/auth/register
// @access  Public
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide name, email and password' });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
    });

    res.status(201).json({
      userId: admin.userId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin.userId, admin.role),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
};

// @desc    Authenticate an admin
// @route   POST /api/admin/auth/login
// @access  Public
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
    
    // Match against environment variables
    if (email === adminEmail && password === adminPassword) {
       let user = await User.findOne({ email });
       
       // Auto-seed the admin if they don't exist in the database yet
       if (!user) {
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(password, salt);
         user = await User.create({
           name: 'System Admin',
           email: adminEmail,
           passwordHash: hashedPassword,
           role: 'ADMIN',
         });
       }

       res.json({
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user.userId, user.role),
       });
       return;
    }

    const user = await User.findOne({ email });

    if (user && user.role === 'ADMIN' && (await bcrypt.compare(password, user.passwordHash))) {
      const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
      await UserActivity.create({
        userId: user.userId,
        action: 'ADMIN_LOGIN',
        ipAddress: ipAddress
      });

      res.json({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.userId, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};
