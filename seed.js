import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

dotenv.config();

const poster = (t) => `https://placehold.co/300x450/1f2937/ffffff?text=${encodeURIComponent(t)}`;

const movies = [
  { title: 'Space Odyssey', genre: 'Sci-Fi', language: 'Hindi', duration: 148, rating: 8.2, description: 'Ek space mission jo insaan ki soch badal deta hai.' },
  { title: 'Mumbai Nights', genre: 'Thriller', language: 'Hindi', duration: 132, rating: 7.6, description: 'Raat bhar chalne wali ek gripping chase.' },
  { title: 'Laugh Riot', genre: 'Comedy', language: 'Hindi', duration: 125, rating: 7.1, description: 'Dosto ki hasi-mazaak se bhari family comedy.' },
  { title: 'The Last Kingdom', genre: 'Action', language: 'English', duration: 155, rating: 8.5, description: 'Ek raja, ek yudh aur ek aakhri mauka.' },
];

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany(), Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);

await User.create({ name: 'Admin', email: 'admin@movie.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
const created = await Movie.insertMany(movies.map((m) => ({ ...m, poster: poster(m.title) })));

const slots = [11, 14, 18, 21];
const theatres = [
  { theatre: 'PVR Cinemas', city: 'Moradabad', screen: 'Screen 1', price: 250 },
  { theatre: 'City Cinema', city: 'Moradabad', screen: 'Screen 2', price: 180 },
];
const shows = [];
for (const movie of created) {
  for (let d = 0; d < 3; d++) {
    for (const t of theatres) {
      const hour = slots[Math.floor(Math.random() * slots.length)];
      const time = new Date();
      time.setDate(time.getDate() + d + (d === 0 ? 1 : 0));
      time.setHours(hour, 0, 0, 0);
      shows.push({ movie: movie._id, ...t, startTime: time });
    }
  }
}
await Show.insertMany(shows);

console.log('Seed complete!');
console.log('Admin login -> email: admin@movie.com | password: admin123');
await mongoose.disconnect();
