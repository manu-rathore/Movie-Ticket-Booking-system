import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serverless-safe MongoDB connection cache
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      })
      .then((conn) => {
        console.log('MongoDB connected');
        return conn;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  await connectionPromise;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(500).json({ message: 'Database connection error: ' + err.message });
  }
});

app.get('/', (req, res) => res.send('Movie Booking API chal rahi hai'));
app.get('/api/health', (req, res) => {
  res.json({
    ok: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5001;

// Only listen when running standalone server (not on Vercel serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => console.error('MongoDB startup error:', err.message));
}

export default app;
