import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

dotenv.config();

const movies = [
  {
    title: 'Interstellar: Beyond Space',
    genre: 'Sci-Fi',
    language: 'Hindi',
    duration: 169,
    rating: 8.9,
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    description: 'Ek thrilling interstellar yatra jahan insaniyat ke astitva ki aakhri ladai shuru hoti hai.'
  },
  {
    title: 'The Dark Shadow: Rise',
    genre: 'Action',
    language: 'English',
    duration: 152,
    rating: 8.7,
    poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    description: 'Gotham ki andheri sadkon par shuru hota hai nayaye aur badle ka sabse bada sangharsh.'
  },
  {
    title: 'Mumbai City Lights',
    genre: 'Thriller',
    language: 'Hindi',
    duration: 135,
    rating: 8.1,
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    description: 'Mumbai ki tez raftaar raat mein ek suspenseful crime mystery aur intense investigative chase.'
  },
  {
    title: 'Comedy Circus 2026',
    genre: 'Comedy',
    language: 'Hindi',
    duration: 122,
    rating: 7.9,
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    description: 'Doston ki mastiyo aur confusions se bhari ek laugh-riot family comedy drama.'
  },
  {
    title: 'Cyberpunk Odyssey',
    genre: 'Sci-Fi',
    language: 'English',
    duration: 140,
    rating: 8.4,
    poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    description: 'Bhavishya ki neon duniya mein ek rogue hacker aur AI empire ke beech digital yuddh.'
  },
  {
    title: 'Kingdom of Warriors',
    genre: 'Action',
    language: 'Hindi',
    duration: 160,
    rating: 8.6,
    poster: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=600&auto=format&fit=crop&q=80',
    description: 'Ek mahan raja, uske wafadaar sainik aur singhasan bachane ki aitihaasik ladai.'
  }
];

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany(), Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);

await User.create({
  name: 'Admin',
  email: 'admin@movie.com',
  password: await bcrypt.hash('admin123', 10),
  role: 'admin'
});

const created = await Movie.insertMany(movies);

const slots = [10, 13, 16, 19, 22];
const theatres = [
  { theatre: 'PVR IMAX', city: 'Mumbai', screen: 'Audi 1 (IMAX)', price: 350 },
  { theatre: 'INOX Megaplex', city: 'Mumbai', screen: 'Audi 2 (Dolby Atmos)', price: 280 },
  { theatre: 'Cinepolis Luxe', city: 'Delhi', screen: 'Screen 1 VIP', price: 320 },
  { theatre: 'Wave Cinemas', city: 'Noida', screen: 'Gold Class', price: 240 },
];

const shows = [];
for (const movie of created) {
  for (let d = 0; d < 3; d++) {
    for (const t of theatres) {
      const hour = slots[Math.floor(Math.random() * slots.length)];
      const time = new Date();
      time.setDate(time.getDate() + d);
      time.setHours(hour, 0, 0, 0);
      shows.push({
        movie: movie._id,
        theatre: t.theatre,
        city: t.city,
        screen: t.screen,
        price: t.price,
        startTime: time,
        bookedSeats: []
      });
    }
  }
}

await Show.insertMany(shows);

console.log('Seed with HD posters and multiple theatres complete!');
console.log('Admin login -> email: admin@movie.com | password: admin123');
await mongoose.disconnect();
