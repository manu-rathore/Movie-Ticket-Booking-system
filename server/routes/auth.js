import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone || '',
  preferredCity: u.preferredCity || 'All',
  watchlist: (u.watchlist || []).map((id) => String(id._id || id)),
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Saari fields bharein' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email pehle se registered hai' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone: phone || '' });
    res.status(201).json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.password)))
      return res.status(400).json({ message: 'Email ya password galat hai' });
    res.json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('watchlist');
    if (!user) return res.status(404).json({ message: 'User nahi mila' });
    res.json({
      user: publicUser(user),
      watchlistMovies: user.watchlist || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, preferredCity } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (preferredCity !== undefined) updates.preferredCity = String(preferredCity).trim() || 'All';

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/watchlist/:movieId', protect, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User nahi mila' });

    const exists = (user.watchlist || []).some((id) => String(id) === String(movieId));
    if (exists) {
      user.watchlist = user.watchlist.filter((id) => String(id) !== String(movieId));
    } else {
      user.watchlist.push(movieId);
    }
    await user.save();

    res.json({
      saved: !exists,
      watchlist: user.watchlist.map((id) => String(id)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
