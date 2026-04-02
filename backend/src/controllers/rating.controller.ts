import { Request, Response } from 'express';
import { Rating } from '../models/Rating.model';
import { Booking } from '../models/Booking.model';
import { WorkerProfile } from '../models/WorkerProfile.model';
import { User } from '../models/User.model';

// @desc    Create a new rating/review for a booking
// @route   POST /api/ratings
// @access  Private/Customer
export const createRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, ratingScore, reviewText } = req.body;

    // Find the booking
    const booking = await Booking.findOne({ bookingId }).lean();

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Security & Logic checks
    if (booking.customerId !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized to rate this booking' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({ message: 'Can only rate completed bookings' });
      return;
    }

    const existingRating = await Rating.findOne({ bookingId });
    if (existingRating) {
      res.status(400).json({ message: 'Booking already has a rating' });
      return;
    }

    // Create rating
    const rating = await Rating.create({
      bookingId,
      customerId: req.user.userId,
      workerId: booking.workerId,
      ratingScore: Number(ratingScore),
      reviewText
    });

    // Update worker's average rating
    const allRatings = await Rating.find({ workerId: booking.workerId });
    const average = allRatings.reduce((acc, curr) => acc + curr.ratingScore, 0) / allRatings.length;

    await WorkerProfile.findOneAndUpdate(
      { userId: booking.workerId }, // WorkerId in booking is the userId of the worker
      { ratingAverage: average }
    );

    res.status(201).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating rating' });
  }
};

// @desc    Get ratings for a specific worker
// @route   GET /api/ratings/worker/:workerId
// @access  Public
export const getWorkerRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await Rating.find({ workerId: String(req.params.workerId) })
      .sort({ timestamp: -1 })
      .lean();
      
    // Fetch customer details manually to simulate Prisma include
    const customerIds = ratings.map(r => r.customerId);
    const customers = await User.find({ userId: { $in: customerIds } }, 'userId name').lean();
    const customerMap = new Map(customers.map(c => [c.userId, c]));
    
    const ratingsWithCustomers = ratings.map(r => ({
      ...r,
      customer: customerMap.get(r.customerId)
    }));
      
    res.json(ratingsWithCustomers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching worker ratings' });
  }
};
