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

// MongoDB connection cache for serverless environments (Vercel)
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.get('/', (req, res) => res.send('Movie Booking API chal rahi hai'));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5001;

// Only listen when running standalone server (not on Vercel serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  });
}

export default app;
