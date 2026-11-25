import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: { type: [String], required: true },
    snacks: [
      {
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    seatSubtotal: { type: Number, default: 0 },
    snacksTotal: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    promoCode: { type: String, default: '' },
    paymentMethod: { type: String, default: 'UPI' },
    paymentStatus: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
