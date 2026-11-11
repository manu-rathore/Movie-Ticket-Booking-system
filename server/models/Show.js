import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: String, required: true },
    city: { type: String, required: true },
    screen: { type: String, default: 'Screen 1' },
    startTime: { type: Date, required: true },
    price: { type: Number, required: true },
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Show', showSchema);
