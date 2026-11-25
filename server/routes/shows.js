import express from 'express';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Available cities list for active upcoming shows
router.get('/cities', async (req, res) => {
  try {
    const cities = await Show.distinct('city', { startTime: { $gte: new Date() } });
    res.json(cities.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: saare shows
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const shows = await Show.find()
      .populate('movie', 'title poster status')
      .sort({ startTime: 1 });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kisi movie ke aane wale shows (with optional city filter)
router.get('/movie/:movieId', async (req, res) => {
  try {
    const query = { movie: req.params.movieId, startTime: { $gte: new Date() } };
    if (req.query.city && req.query.city !== 'All') {
      query.city = req.query.city;
    }
    const shows = await Show.find(query).sort({ startTime: 1 });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
    const movie = await Movie.findById(req.body.movie);
    if (!movie) return res.status(404).json({ message: 'Movie nahi mili' });
    const created = await Show.create(req.body);
    const populated = await Show.findById(created._id).populate('movie', 'title poster status');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: 'Show delete ho gaya' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
