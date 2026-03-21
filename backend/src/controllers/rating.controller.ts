import { Request, Response } from 'express';
import { prisma } from '../index';

// @desc    Create a new rating/review for a booking
// @route   POST /api/ratings
// @access  Private/Customer
export const createRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, ratingScore, reviewText } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: { rating: true }
    });

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

    if (booking.rating) {
      res.status(400).json({ message: 'Booking already has a rating' });
      return;
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        bookingId,
        customerId: req.user.userId,
        workerId: booking.workerId,
        ratingScore: Number(ratingScore),
        reviewText
      }
    });

    // Update worker's average rating
    const allRatings = await prisma.rating.findMany({
      where: { workerId: booking.workerId }
    });

    const average = allRatings.reduce((acc, curr) => acc + curr.ratingScore, 0) / allRatings.length;

    await prisma.workerProfile.update({
      where: { userId: booking.workerId }, // WorkerId in booking is the userId of the worker
      data: { ratingAverage: average }
    });

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
    const ratings = await prisma.rating.findMany({
      where: { workerId: String(req.params.workerId) },
      include: {
        customer: { select: { name: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching worker ratings' });
  }
};
