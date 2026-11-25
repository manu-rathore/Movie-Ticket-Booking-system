import express from 'express';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

function toStringArray(val, fallback = []) {
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === 'string') return val.split(',').map((x) => x.trim()).filter(Boolean);
  return fallback;
}

function normalizeMoviePayload(body) {
  const payload = { ...body };
  if (payload.cast !== undefined) payload.cast = toStringArray(payload.cast);
  if (payload.formats !== undefined) {
    const fmts = toStringArray(payload.formats);
    payload.formats = fmts.length ? fmts : ['2D'];
  }
  if (payload.duration !== undefined && payload.duration !== '') payload.duration = Number(payload.duration);
  if (payload.rating !== undefined && payload.rating !== '') payload.rating = Number(payload.rating);
  if (payload.releaseDate === '') payload.releaseDate = null;
  return payload;
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter =
      status === 'upcoming'
        ? { status: 'upcoming' }
        : status === 'now_showing'
        ? { $or: [{ status: 'now_showing' }, { status: { $exists: false } }] }
        : {};

    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
    const payload = normalizeMoviePayload(req.body);
    res.status(201).json(await Movie.create(payload));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizeMoviePayload(req.body);
    const movie = await Movie.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!movie) return res.status(404).json({ message: 'Movie nahi mili' });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Show.deleteMany({ movie: req.params.id });
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie delete ho gayi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle Notify Me / Interested on an Upcoming or Now Showing movie
router.post('/:id/interest', protect, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie nahi mili' });

    const userId = String(req.user._id);
    const already = (movie.interestedUsers || []).some((u) => String(u) === userId);
    const update = already
      ? { $pull: { interestedUsers: req.user._id } }
      : { $addToSet: { interestedUsers: req.user._id } };

    const updated = await Movie.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({
      interested: !already,
      count: (updated.interestedUsers || []).length,
      interestedUsers: updated.interestedUsers || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add or update a user review & rating
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 10) {
      return res.status(400).json({ message: 'Rating 1 se 10 ke beech honi chahiye' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Review comment likhein' });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie nahi mili' });

    const existingIdx = (movie.reviews || []).findIndex((r) => String(r.user) === String(req.user._id));
    if (existingIdx >= 0) {
      movie.reviews[existingIdx].rating = numRating;
      movie.reviews[existingIdx].comment = comment.trim();
      movie.reviews[existingIdx].name = req.user.name;
    } else {
      movie.reviews.unshift({
        user: req.user._id,
        name: req.user.name,
        rating: numRating,
        comment: comment.trim(),
      });
    }

    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
