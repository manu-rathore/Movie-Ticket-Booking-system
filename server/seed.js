import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

dotenv.config();

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const movies = [
  {
    title: 'Interstellar: Beyond Space',
    genre: 'Sci-Fi',
    language: 'Hindi',
    duration: 169,
    rating: 8.9,
    certificate: 'U/A',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    formats: ['2D', 'IMAX', '4DX'],
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    status: 'now_showing',
    releaseDate: daysFromNow(-12),
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    description: 'Ek thrilling interstellar yatra jahan insaniyat ke astitva ki aakhri ladai shuru hoti hai.',
  },
  {
    title: 'The Dark Shadow: Rise',
    genre: 'Action',
    language: 'English',
    duration: 152,
    rating: 8.7,
    certificate: 'U/A 13+',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoe Kravitz', 'Paul Dano'],
    formats: ['2D', 'IMAX', 'Dolby Atmos'],
    trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    status: 'now_showing',
    releaseDate: daysFromNow(-7),
    poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    description: 'Gotham ki andheri sadkon par shuru hota hai nyaay aur badle ka sabse bada sangharsh.',
  },
  {
    title: 'Mumbai City Lights',
    genre: 'Thriller',
    language: 'Hindi',
    duration: 135,
    rating: 8.1,
    certificate: 'U/A 16+',
    director: 'Vikramaditya Motwane',
    cast: ['Rajkummar Rao', 'Tabu', 'Vijay Varma'],
    formats: ['2D', 'Dolby Atmos'],
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'now_showing',
    releaseDate: daysFromNow(-5),
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    description: 'Mumbai ki tez raftaar raat mein ek suspenseful crime mystery aur intense investigative chase.',
  },
  {
    title: 'Comedy Circus 2026',
    genre: 'Comedy',
    language: 'Hindi',
    duration: 122,
    rating: 7.9,
    certificate: 'U',
    director: 'Priyadarshan',
    cast: ['Akshay Kumar', 'Paresh Rawal', 'Pankaj Tripathi'],
    formats: ['2D'],
    trailerUrl: 'https://www.youtube.com/watch?v=tgbNymZ7vqY',
    status: 'now_showing',
    releaseDate: daysFromNow(-3),
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    description: 'Doston ki mastiyo aur confusions se bhari ek laugh-riot family comedy drama.',
  },
  {
    title: 'Cyberpunk Odyssey',
    genre: 'Sci-Fi',
    language: 'English',
    duration: 140,
    rating: 8.4,
    certificate: 'U/A 13+',
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Ana de Armas', 'Keanu Reeves'],
    formats: ['3D', 'IMAX', '4DX'],
    trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4',
    status: 'now_showing',
    releaseDate: daysFromNow(-10),
    poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    description: 'Bhavishya ki neon duniya mein ek rogue hacker aur AI empire ke beech digital yuddh.',
  },
  {
    title: 'Kingdom of Warriors',
    genre: 'Action',
    language: 'Hindi',
    duration: 160,
    rating: 8.6,
    certificate: 'U/A',
    director: 'S. S. Rajamouli',
    cast: ['Prabhas', 'Rana Daggubati', 'Deepika Padukone'],
    formats: ['2D', '3D', 'IMAX'],
    trailerUrl: 'https://www.youtube.com/watch?v=sOEg_YZQsTI',
    status: 'now_showing',
    releaseDate: daysFromNow(-4),
    poster: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=600&auto=format&fit=crop&q=80',
    description: 'Ek mahan raja, uske wafadaar sainik aur singhasan bachane ki aitihaasik ladai.',
  },
  // Upcoming / Coming Soon Movies
  {
    title: 'Solaris: Dawn of Tomorrow',
    genre: 'Sci-Fi',
    language: 'English',
    duration: 158,
    rating: 9.1,
    certificate: 'U/A',
    director: 'James Cameron',
    cast: ['Timothee Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    formats: ['IMAX 3D', '4DX', 'Dolby Vision'],
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    status: 'upcoming',
    releaseDate: daysFromNow(9),
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    description: 'Dharti ke baad ek naye graha par insaniyat ke pehle shahar ki dastaan aur ek anjaane khatre ka samna.',
  },
  {
    title: 'Aarav: The Secret Agent',
    genre: 'Action',
    language: 'Hindi',
    duration: 145,
    rating: 8.8,
    certificate: 'U/A 13+',
    director: 'Siddharth Anand',
    cast: ['Hrithik Roshan', 'Kiara Advani', 'John Abraham'],
    formats: ['2D', 'IMAX', 'Dolby Atmos'],
    trailerUrl: 'https://www.youtube.com/watch?v=vqu4z34wENw',
    status: 'upcoming',
    releaseDate: daysFromNow(16),
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'High-octane espionage thriller jahan ek undercover agent duniya ke sabse bade syndicate ko rokne nikalta hai.',
  },
  {
    title: 'Midnight Express: Raaz',
    genre: 'Thriller',
    language: 'Hindi',
    duration: 130,
    rating: 8.3,
    certificate: 'A',
    director: 'Sriram Raghavan',
    cast: ['Ayushmann Khurrana', 'Radhika Apte', 'Manoj Bajpayee'],
    formats: ['2D', 'Dolby Atmos'],
    trailerUrl: 'https://www.youtube.com/watch?v=2iVYI99VGaw',
    status: 'upcoming',
    releaseDate: daysFromNow(24),
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80',
    description: 'Ek chalti hui midnight train mein achanak gayab hua musafir aur har dabbe mein chhupa ek naya raaz.',
  },
  {
    title: 'Bhangra & Chaos',
    genre: 'Comedy',
    language: 'Hindi',
    duration: 128,
    rating: 8.0,
    certificate: 'U',
    director: 'Rajkumar Hirani',
    cast: ['Diljit Dosanjh', 'Vicky Kaushal', 'Kriti Sanon'],
    formats: ['2D'],
    trailerUrl: 'https://www.youtube.com/watch?v=6ZfuNTqbHE8',
    status: 'upcoming',
    releaseDate: daysFromNow(32),
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    description: 'Ek Punjabi shaadi jisme dulha gayab ho jata hai aur uske teen yaar sab kuch sambhalne ke chakkar mein aur ulajh jaate hain.',
  },
];

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany(), Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);

const adminUser = await User.create({
  name: 'Admin',
  email: 'admin@movie.com',
  password: await bcrypt.hash('admin123', 10),
  role: 'admin',
  preferredCity: 'Mumbai',
});

const demoUser = await User.create({
  name: 'Manu Rathore',
  email: 'manu@movie.com',
  password: await bcrypt.hash('manu123', 10),
  role: 'user',
  phone: '9876543210',
  preferredCity: 'Mumbai',
});

const seededMovies = movies.map((m) => ({
  ...m,
  interestedUsers: m.status === 'upcoming' ? [demoUser._id] : [],
  reviews:
    m.status === 'now_showing'
      ? [
          {
            user: demoUser._id,
            name: demoUser.name,
            rating: Math.min(10, Math.round(m.rating)),
            comment: 'Kamal ki cinematography aur Dolby Atmos sound experience! Must watch in theatres.',
          },
        ]
      : [],
}));

const created = await Movie.insertMany(seededMovies);

const nowShowingMovies = created.filter((m) => m.status === 'now_showing');

const slots = [
  { hour: 10, min: 30 },
  { hour: 14, min: 15 },
  { hour: 18, min: 0 },
  { hour: 21, min: 30 },
];

const theatres = [
  { theatre: 'PVR IMAX', city: 'Mumbai', screen: 'Audi 1 (IMAX)', price: 320 },
  { theatre: 'INOX Megaplex', city: 'Mumbai', screen: 'Audi 2 (Dolby Atmos)', price: 240 },
  { theatre: 'Cinepolis Luxe', city: 'Delhi', screen: 'Screen 1 VIP', price: 290 },
  { theatre: 'Wave Cinemas', city: 'Noida', screen: 'Gold Class', price: 210 },
];

const shows = [];
const now = new Date();

for (const movie of nowShowingMovies) {
  for (let d = 0; d < 3; d++) {
    for (const t of theatres) {
      // Create 2-3 showtimes per theatre per day so the time-slot UI is rich
      const daySlots = d === 0 ? slots.slice(1) : slots;
      for (const slot of daySlots) {
        const time = new Date();
        time.setDate(time.getDate() + d);
        time.setHours(slot.hour, slot.min, 0, 0);
        if (time > now) {
          const sampleBooked =
            slot.hour === 18 && d === 0 ? ['C4', 'C5', 'D4', 'D5', 'E6', 'G4', 'G5'] : ['D5', 'D6'];
          shows.push({
            movie: movie._id,
            theatre: t.theatre,
            city: t.city,
            screen: t.screen,
            price: t.price,
            startTime: time,
            bookedSeats: sampleBooked,
          });
        }
      }
    }
  }
}

await Show.insertMany(shows);

console.log(`Seed complete! Created ${created.length} movies (${nowShowingMovies.length} now showing, ${created.length - nowShowingMovies.length} upcoming) & ${shows.length} shows.`);
console.log('Admin login -> email: admin@movie.com | password: admin123');
console.log('User login  -> email: manu@movie.com  | password: manu123');
await mongoose.disconnect();
