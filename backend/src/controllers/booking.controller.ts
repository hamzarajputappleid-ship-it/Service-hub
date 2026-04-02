import { Request, Response } from 'express';
import { Booking } from '../models/Booking.model';
import { User } from '../models/User.model';
import { Rating } from '../models/Rating.model';
import { Payment } from '../models/Payment.model';
import { io } from '../index';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/Customer
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workerId, serviceCategory, scheduledDateTime, serviceAddress, specialInstructions, paymentMode, estimatedCost } = req.body;

    // Validate if worker exists and is actually a worker
    const worker = await User.findOne({ userId: workerId, role: 'WORKER' }).lean();

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    const booking = await Booking.create({
      customerId: req.user.userId,
      workerId,
      serviceCategory,
      scheduledDateTime: new Date(scheduledDateTime),
      serviceAddress,
      specialInstructions,
      status: 'PENDING',
      paymentMode: (paymentMode || 'PAY_LATER'),
      estimatedCost: estimatedCost || null
    });

    const customer = await User.findOne({ userId: req.user.userId }, 'name').lean();
    const bookingResponse = { ...booking.toObject(), customer };

    // Emit real-time notification to the worker
    io.emit('booking_created', bookingResponse);

    res.status(201).json(bookingResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// @desc    Get user's bookings (works for both Customers and Workers)
// @route   GET /api/bookings
// @access  Private
export const getMyBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    let bookingsRaw: any[] = [];

    if (req.user.role === 'CUSTOMER') {
      bookingsRaw = await Booking.find({ customerId: req.user.userId })
        .sort({ createdAt: -1 })
        .lean();
    } else if (req.user.role === 'WORKER') {
      bookingsRaw = await Booking.find({ workerId: req.user.userId })
        .sort({ createdAt: -1 })
        .lean();
    } else if (req.user.role === 'ADMIN') {
      bookingsRaw = await Booking.find({})
        .sort({ createdAt: -1 })
        .lean();
    }

    // Manual populates to match Prisma includes behaviour
    const workerIds = [...new Set(bookingsRaw.map(b => b.workerId))];
    const customerIds = [...new Set(bookingsRaw.map(b => b.customerId))];
    const bookingIds = bookingsRaw.map(b => b.bookingId);

    const [workers, customers, ratings, payments] = await Promise.all([
      User.find({ userId: { $in: workerIds } }, 'userId name email phone').lean(),
      User.find({ userId: { $in: customerIds } }, 'userId name email phone').lean(),
      Rating.find({ bookingId: { $in: bookingIds } }).lean(),
      Payment.find({ bookingId: { $in: bookingIds } }).lean()
    ]);

    const workerMap = new Map(workers.map(w => [w.userId, w]));
    const customerMap = new Map(customers.map(c => [c.userId, c]));
    const ratingMap = new Map(ratings.map(r => [r.bookingId, r]));
    const paymentMap = new Map(payments.map(p => [p.bookingId, p]));

    const bookings = bookingsRaw.map(b => ({
      ...b,
      worker: req.user.role === 'CUSTOMER' ? workerMap.get(b.workerId) : undefined,
      customer: req.user.role === 'WORKER' ? customerMap.get(b.customerId) : undefined,
      rating: ratingMap.get(b.bookingId) || null,
      payment: paymentMap.get(b.bookingId) || null
    }));

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// @desc    Update a booking status 
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, estimatedCost } = req.body;
    const bookingId = String(req.params.id);

    // Find the booking
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization check
    if (req.user.role === 'CUSTOMER') {
      if (booking.customerId !== req.user.userId) {
        res.status(403).json({ message: 'Not authorized to update this booking' });
        return;
      }
      if (status !== 'CANCELLED') {
        res.status(400).json({ message: 'Customers can only cancel bookings' });
        return;
      }
    }

    if (req.user.role === 'WORKER') {
      if (booking.workerId !== req.user.userId) {
        res.status(403).json({ message: 'Not authorized to update this booking' });
        return;
      }
    }

    // Perform update
    const updateData: any = { status };
    if (estimatedCost !== undefined && req.user.role === 'WORKER') {
      updateData.estimatedCost = estimatedCost;
    }

    const updatedBookingRaw = await Booking.findOneAndUpdate(
      { bookingId },
      updateData,
      { new: true }
    ).lean();
    
    // Fill in worker and customer for socket response
    const worker = await User.findOne({ userId: updatedBookingRaw?.workerId }, 'name').lean();
    const customer = await User.findOne({ userId: updatedBookingRaw?.customerId }, 'name').lean();
    
    const updatedBooking = {
      ...updatedBookingRaw,
      worker,
      customer
    };

    // Emit real-time notification for status change
    io.emit('booking_status_updated', updatedBooking);

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
};
