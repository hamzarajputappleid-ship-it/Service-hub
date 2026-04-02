import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne(
      { userId: req.user.userId },
      'userId name email phone role status createdAt'
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (user) {
      const updateData: any = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone !== undefined ? req.body.phone : user.phone,
      };

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await User.findOneAndUpdate(
        { userId: req.user.userId },
        updateData,
        { new: true }
      ).select('userId name email phone role');

      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
