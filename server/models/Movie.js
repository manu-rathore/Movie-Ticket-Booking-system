import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    poster: String,
    backdrop: String,
    duration: Number, // minutes
    genre: String,
    language: String,
    rating: { type: Number, default: 8.0 },
    certificate: { type: String, default: 'U/A' },
    director: String,
    cast: { type: [String], default: [] },
    formats: { type: [String], default: ['2D'] },
    trailerUrl: String,
    status: { type: String, enum: ['now_showing', 'upcoming'], default: 'now_showing' },
    releaseDate: Date,
    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Movie', movieSchema);
