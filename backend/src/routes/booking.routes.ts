import express from 'express';
import { createBooking, getMyBookings, updateBookingStatus } from '../controllers/booking.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .post(protect, createBooking)
  .get(protect, getMyBookings);

router.patch('/:id/status', protect, updateBookingStatus);

export default router;
