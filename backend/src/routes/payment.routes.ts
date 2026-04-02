import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Booking } from '../models/Booking.model';
import { Payment } from '../models/Payment.model';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Initialize Stripe with the secret key — currency locked to PKR
// We use a fallback so the server doesn't crash if the env var is missing during dev
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_prevent_crash', {
  apiVersion: '2024-06-20' as any,
});

const CURRENCY = 'pkr'; // Pakistani Rupee

/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent in PKR for a given booking.
 * Amount should be sent in PKR (e.g. 5000 = PKR 5,000)
 */
router.post('/create-intent', protect, async (req: Request, res: Response) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'bookingId and a valid amount (in PKR) are required' });
  }

  try {
    // Verify booking belongs to this user
    const userId = (req as any).user.userId;
    const booking = await Booking.findOne({ bookingId: bookingId as string, customerId: userId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or access denied' });
    }

    // Stripe amounts are in smallest currency unit — PKR uses paisa (1 PKR = 100 paisa)
    const amountInPaisa = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaisa,
      currency: CURRENCY,
      metadata: {
        bookingId,
        userId,
      },
      description: `Service Hub payment for booking ${bookingId}`,
    });

    // Upsert a payment record in the database
    await Payment.findOneAndUpdate(
      { bookingId: bookingId as string },
      {
        bookingId: bookingId as string,
        amount,
        paymentMethod: 'card',
        paymentStatus: 'PENDING',
        transactionId: paymentIntent.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ clientSecret: paymentIntent.client_secret, intentId: paymentIntent.id });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ message: error.message || 'Payment intent creation failed' });
  }
});

/**
 * POST /api/payments/confirm
 * Called by frontend after Stripe confirms payment to update DB status
 */
router.post('/confirm', protect, async (req: Request, res: Response) => {
  const { bookingId, paymentIntentId } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const status = intent.status === 'succeeded' ? 'SUCCESS' : 'FAILED';

    const payment = await Payment.findOneAndUpdate(
      { bookingId: bookingId as string },
      { paymentStatus: status },
      { new: true }
    );

    res.json({ payment, status });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to confirm payment' });
  }
});

/**
 * GET /api/payments/:bookingId
 * Retrieve payment status for a booking
 */
router.get('/:bookingId', protect, async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  try {
    const payment = await Payment.findOne({ bookingId: bookingId as string });
    if (!payment) return res.status(404).json({ message: 'No payment found for this booking' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve payment' });
  }
});

export default router;
