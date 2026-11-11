# CineBook Pro - Movie Ticket Booking System (MERN)

Ek modern, sleek aur responsive Cinema Ticket Booking Web Application (MERN Stack + Modern Glassmorphism UI).

---

## ✨ Naye Features aur Design Improvements

1. **🎨 Premium UI & Glassmorphism Theme**:
   - Modern Dark Mode palette (`Plus Jakarta Sans` font, neon glows, glassmorphism cards).
   - Animated Hero Banner, rating badges, aur hover effects.

2. **🔍 Advanced Filters & Search**:
   - Live title/genre search bar.
   - Interactive Genre pills (🍿 All, Action, Sci-Fi, Comedy, etc.).
   - Language selector dropdown.

3. **🍿 Snacks & Food Addons (Checkout Modal)**:
   - Seat select karne ke baad Caramel Popcorn, Pepsi, Cheesy Nachos, Burger add karne ka option.
   - Real-time billing breakdown (Seats + Snacks = Total Amount).

4. **🎟️ Digital Pass & Printable E-Ticket**:
   - "My Bookings" page par har confirmed ticket ke liye official cinema boarding pass view.
   - Mock barcode/QR code aur **Print Pass** (`window.print()`) feature.

5. **⚡ Upgraded Admin Dashboard**:
   - Analytics KPIs: Total Revenue (₹), Active Movies, Total Bookings, Confirmed Tickets.
   - Instant search/filter customer bookings table.
   - Fast Movie & Showtimes scheduler.

6. **📱 Seat Selection Experience**:
   - Visual 3D curved cinema screen effect ("ALL EYES THIS WAY").
   - Live seat counter and real-time total calculation.

---

## 🚀 Run Karne Ke Steps

### Terminal 1 - Backend (Server)
```bash
cd server
npm install
npm run seed      # Sample movies, shows aur admin banata hai
npm run dev       # Server http://localhost:5000 par chalega
```

### Terminal 2 - Frontend (Client)
```bash
cd client
npm install
npm run dev       # App http://localhost:5173 par khulegi
```

---

## 🔑 Admin Credentials
- **Email:** `admin@movie.com`
- **Password:** `admin123`

---

## ⚙️ MongoDB Atlas Setup (Optional)
Agar local MongoDB nahi hai toh `server/.env` file mein `MONGO_URI` ko apni Atlas string se replace karein.
