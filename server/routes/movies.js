import express from 'express';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie nahi mili' });
    res.json(movie);
  } catch {
    res.status(404).json({ message: 'Movie nahi mili' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Movie.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(movie);
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Show.deleteMany({ movie: req.params.id });
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: 'Movie delete ho gayi' });
});

export default router;
