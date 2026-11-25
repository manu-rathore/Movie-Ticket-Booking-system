# CineBook Pro - Movie Ticket Booking System (MERN)

Ek modern, full-featured Cinema Ticket Booking Web Application (MERN Stack + Modern Glassmorphism UI).

---

## ✨ Key Features

1. **🚀 Upcoming Movies Panel (Coming Soon)**:
   - Dedicated **Upcoming Movies Panel** & Rotating Hero Spotlight with release countdowns (`In X Days`, `Releasing Tomorrow`).
   - **▶ Watch Trailer Modal**: Built-in YouTube trailer player.
   - **🔔 Notify Me / Interested**: Live interest counter & release reminder toggle per movie.

2. **📍 City, Date & Theatre Showtime Explorer**:
   - Global **City Picker** (`Mumbai`, `Delhi`, `Noida`, `All Cities`) in the navbar.
   - **Date Tabs** (`Today`, `Tomorrow`, etc.) & Theatre-grouped showtimes with live seat availability indicators (`X left` / `Full`).

3. **🪑 Tiered Cinema Seat Map**:
   - Realistic auditorium layout with center aisle separation and max 10 seats guard.
   - **Silver Classic**, **Gold Executive (+₹50)**, and **Platinum Recliner (+₹120)** pricing tiers.

4. **🍿 Snacks, Promo Codes & Secure Payment Modal**:
   - Add Caramel Popcorn, Pepsi, Cheesy Nachos, and Crispy Veg Burger.
   - Server-verified Promo Codes: `FIRST100`, `CINE20`, `POPCORN50`.
   - Interactive Checkout Modal supporting **UPI / QR**, **Debit/Credit Cards**, and **NetBanking**.

5. **🎟️ Digital E-Ticket Pass, Print & Refunds**:
   - Filterable **My Tickets** (`All`, `Confirmed`, `Cancelled`) with unique `CB-XXXXXX` booking reference & deterministic QR code.
   - Print-ready `@media print` ticket layout + 1-click ticket cancellation with automatic seat release & refund status.

6. **⭐ Audience Reviews, Watchlist & Profile**:
   - Submit star ratings (`1–10`) & reviews on movie detail pages.
   - Save movies to **❤️ Watchlist** and manage account settings & default city on **Profile**.

7. **⚡ 4-Tab Admin Command Center**:
   - **Movies & Upcoming Panel**: Add/Edit movies (cast, director, formats, certificate, trailer, release date) + 1-click toggle between **Now Showing** and **Upcoming**.
   - **Showtimes Manager**: Schedule and delete showtimes across theatres & cities.
   - **Bookings Manager**: Search by customer/movie/reference ID and cancel/refund bookings.
   - **Revenue Analytics**: Total revenue KPIs and movie-wise box office breakdown.

---

## 🚀 Run Karne Ke Steps

### Terminal 1 - Backend (Server)
```bash
cd server
npm install
npm run seed      # Sample Now Showing + Upcoming movies, shows, and demo users
npm run dev       # Server http://localhost:5001 par chalega
```

### Terminal 2 - Frontend (Client)
```bash
cd client
npm install
npm run dev       # App http://localhost:5173 par khulegi
```

---

## 🔑 Demo Credentials
- **Admin:** `admin@movie.com` / `admin123`
- **User:** `manu@movie.com` / `manu123`

---

## ⚙️ Environment Setup
`server/.env` mein apna `MONGO_URI` aur `JWT_SECRET` set karein (reference: `server/.env.example`).
