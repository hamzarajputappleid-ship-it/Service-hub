import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken';
import { User } from '../models/User.model';
import { WorkerProfile } from '../models/WorkerProfile.model';
import { UserActivity } from '../models/UserActivity.model';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide name, email and password' });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      phone: phone || null,
      role: role || 'CUSTOMER',
    });

    // If worker, also create an empty worker profile for them
    if (user.role === 'WORKER') {
      await WorkerProfile.create({
        userId: user.userId,
        serviceCategory: 'Uncategorized', // default, to be updated later
      });
    }

    if (user) {
      res.status(201).json({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.userId, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('--- NEW LOGIN ATTEMPT ---');
    console.log('Login attempt for email:', JSON.stringify(email));
    console.log('Login attempt for password:', JSON.stringify(password));

    // Find user by email
    const user = await User.findOne({ email });
    
    console.log('User found in DB for login:', !!user);
    if (user) {
      console.log('Password match check for:', email, 'result:', await bcrypt.compare(password, user.passwordHash));
    }

    // Check if user is suspended
    if (user && user.status === 'SUSPENDED') {
      res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Check password
    if (user && (await bcrypt.compare(password, user.passwordHash))) {

      // Record login activity
      const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
      await UserActivity.create({
        userId: user.userId,
        action: 'LOGIN',
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
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Authenticate with Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ message: 'Invalid Google token' });
      return;
    }

    const { email, name, picture } = payload;
    if (!email) {
      res.status(401).json({ message: 'Google account missing email' });
      return;
    }

    // Attempt to find existing user or create a new one
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user defaulted as CUSTOMER with random password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = await User.create({
        name: name || 'Google User',
        email,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
      });
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Record login activity
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    await UserActivity.create({
      userId: user.userId,
      action: 'LOGIN',
      ipAddress: ipAddress
    });

    res.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.userId, user.role),
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};
