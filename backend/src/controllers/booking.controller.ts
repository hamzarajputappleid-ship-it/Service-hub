import { Request, Response } from 'express';
import { prisma, io } from '../index';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/Customer
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workerId, serviceCategory, scheduledDateTime, serviceAddress, specialInstructions, paymentMode, estimatedCost } = req.body;

    // Validate if worker exists and is actually a worker
    const worker = await prisma.user.findFirst({
      where: { userId: workerId, role: 'WORKER' }
    });

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.userId,
        workerId,
        serviceCategory,
        scheduledDateTime: new Date(scheduledDateTime),
        serviceAddress,
        specialInstructions,
        status: 'PENDING',
        paymentMode: (paymentMode || 'PAY_LATER') as any,
        estimatedCost: estimatedCost || null
      },
      include: {
        customer: { select: { name: true } }
      }
    });

    // Emit real-time notification to the worker
    io.emit('booking_created', booking);

    res.status(201).json(booking);
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
    let bookings;

    if (req.user.role === 'CUSTOMER') {
      bookings = await prisma.booking.findMany({
        where: { customerId: req.user.userId },
        include: {
          worker: { select: { name: true, email: true, phone: true } },
          rating: true,
          payment: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'WORKER') {
      bookings = await prisma.booking.findMany({
        where: { workerId: req.user.userId },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          rating: true,
          payment: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'ADMIN') {
        bookings = await prisma.booking.findMany({
            orderBy: { createdAt: 'desc' }
        })
    }

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
    const booking = await prisma.booking.findUnique({
      where: { bookingId }
    });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization check
    // Customers can only cancel their own bookings
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

    // Workers can update status of their assigned bookings
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

    const updatedBooking = await prisma.booking.update({
      where: { bookingId },
      data: updateData,
      include: {
        worker: { select: { name: true } },
        customer: { select: { name: true } }
      }
    });

    // Emit real-time notification for status change
    io.emit('booking_status_updated', updatedBooking);

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
};
