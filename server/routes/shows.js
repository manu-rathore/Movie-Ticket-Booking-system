import express from 'express';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Kisi movie ke aane wale shows
router.get('/movie/:movieId', async (req, res) => {
  const shows = await Show.find({ movie: req.params.movieId, startTime: { $gte: new Date() } }).sort({
    startTime: 1,
  });
  res.json(shows);
});

router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie');
    if (!show) return res.status(404).json({ message: 'Show nahi mila' });
    res.json(show);
  } catch {
    res.status(404).json({ message: 'Show nahi mila' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Show.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Show.findByIdAndDelete(req.params.id);
  res.json({ message: 'Show delete ho gaya' });
});

export default router;
