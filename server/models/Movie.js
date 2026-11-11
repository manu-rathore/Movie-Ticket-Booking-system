import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    poster: String,
    duration: Number, // minutes
    genre: String,
    language: String,
    rating: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Movie', movieSchema);
