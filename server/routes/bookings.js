import express from 'express';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Booking banao
router.post('/', protect, async (req, res) => {
  try {
    const { showId, snacks = [] } = req.body;
    const seats = [...new Set(req.body.seats || [])];
    if (!seats.length) return res.status(400).json({ message: 'Kam se kam ek seat chunein' });
    if (seats.length > 10) return res.status(400).json({ message: 'Ek baar mein max 10 seats' });

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: 'Show nahi mila' });

    // Atomic update: double booking protection
    const updated = await Show.findOneAndUpdate(
      { _id: showId, bookedSeats: { $nin: seats } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ message: 'Kuch seats pehle hi book ho chuki hain, dobara chunein' });

    const seatsAmount = seats.length * show.price;
    const snacksAmount = (snacks || []).reduce((sum, s) => sum + (s.qty || 0) * (s.price || 0), 0);
    const totalAmount = req.body.totalAmount ? Number(req.body.totalAmount) : (seatsAmount + snacksAmount);

    const booking = await Booking.create({
      user: req.user._id,
      show: showId,
      seats,
      snacks: snacks || [],
      totalAmount,
    });
    res.status(201).json(booking);
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
