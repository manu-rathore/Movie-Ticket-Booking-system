import express from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  SNACKS_CATALOG,
  PROMO_CODES,
  calculateSeatsTotal,
  evaluatePromo,
} from '../utils/pricing.js';

const router = express.Router();

const SEAT_PATTERN = /^[A-H](10|[1-9])$/;

// Public promo offers list
router.get('/promos', (req, res) => {
  res.json(PROMO_CODES);
});

// Validate promo code before payment
router.post('/validate-promo', (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const result = evaluatePromo(code, Number(subtotal) || 0);
  if (!result.valid) return res.status(400).json(result);
  res.json(result);
});

// Booking banao
router.post('/', protect, async (req, res) => {
  try {
    const { showId, snacks = [], promoCode = '', paymentMethod = 'UPI' } = req.body;
    const seats = [...new Set((req.body.seats || []).map((s) => String(s).toUpperCase()))];
    if (!seats.length) return res.status(400).json({ message: 'Kam se kam ek seat chunein' });
    if (seats.length > 10) return res.status(400).json({ message: 'Ek baar mein max 10 seats' });
    if (seats.some((s) => !SEAT_PATTERN.test(s))) {
      return res.status(400).json({ message: 'Invalid seat selection' });
    }

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: 'Show nahi mila' });
    if (new Date(show.startTime).getTime() < Date.now() - 30 * 60 * 1000) {
      return res.status(400).json({ message: 'Ye show time nikal chuka hai' });
    }

    // Atomic update: double booking protection
    const updated = await Show.findOneAndUpdate(
      { _id: showId, bookedSeats: { $nin: seats } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ message: 'Kuch seats pehle hi book ho chuki hain, dobara chunein' });
    }

    const sanitizedSnacks = (Array.isArray(snacks) ? snacks : [])
      .map((item) => {
        const qty = Math.max(0, Math.min(20, parseInt(item.qty, 10) || 0));
        const catalogPrice = SNACKS_CATALOG[item.name];
        const unitPrice = catalogPrice !== undefined ? catalogPrice : Math.max(0, Number(item.price) || 0);
        return qty > 0 && item.name ? { name: item.name, qty, price: unitPrice } : null;
      })
      .filter(Boolean);

    const seatSubtotal = calculateSeatsTotal(seats, show.price);
    const snacksTotal = sanitizedSnacks.reduce((sum, s) => sum + s.qty * s.price, 0);
    const convenienceFee = 30;
    const grossTotal = seatSubtotal + snacksTotal + convenienceFee;

    let discountAmount = 0;
    let appliedCode = '';
    if (promoCode && promoCode.trim()) {
      const promoResult = evaluatePromo(promoCode, seatSubtotal + snacksTotal);
      if (promoResult.valid) {
        discountAmount = promoResult.discount;
        appliedCode = promoResult.code;
      }
    }

    const totalAmount = Math.max(0, grossTotal - discountAmount);
    const bookingCode = `CB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const booking = await Booking.create({
      bookingCode,
      user: req.user._id,
      show: showId,
      seats,
      snacks: sanitizedSnacks,
      seatSubtotal,
      snacksTotal,
      convenienceFee,
      discountAmount,
      promoCode: appliedCode,
      paymentMethod: String(paymentMethod || 'UPI').toUpperCase(),
      paymentStatus: 'paid',
      totalAmount,
    });

    const populated = await Booking.findById(booking._id).populate({
      path: 'show',
      populate: { path: 'movie' },
    });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Meri bookings
router.get('/my', protect, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({ path: 'show', populate: { path: 'movie' } })
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// Booking cancel
router.put('/:id/cancel', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mila' });
  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Allowed nahi hai' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Pehle se cancel hai' });

  booking.status = 'cancelled';
  booking.paymentStatus = 'refunded';
  await booking.save();
  await Show.updateOne({ _id: booking.show }, { $pull: { bookedSeats: { $in: booking.seats } } });
  res.json(booking);
});

// Admin: saari bookings
router.get('/', protect, adminOnly, async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email')
    .populate({ path: 'show', populate: { path: 'movie', select: 'title' } })
    .sort({ createdAt: -1 });
  res.json(bookings);
});

export default router;
