import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import api from './api.js';
import Home from './pages/Home.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import AuthPage from './pages/AuthPage.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';

function Navbar() {
  const { user, logout, city, setCity } = useAuth();
  const [cities, setCities] = useState(['Mumbai', 'Delhi', 'Noida']);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api
      .get('/shows/cities')
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setCities(r.data);
        }
      })
      .catch(() => {});
  }, []);

  const goUpcoming = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/#upcoming-panel');
      setTimeout(() => {
        document.getElementById('upcoming-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('upcoming-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/" className="logo">
          <span>🎬</span> CineBook{' '}
          <span className="logo-badge">PRO</span>
        </Link>

        <div className="city-picker">
          <span aria-hidden="true">📍</span>
          <select
            aria-label="Select City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="All">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Movies
        </NavLink>
        <a href="#upcoming-panel" onClick={goUpcoming} className="nav-link upcoming-nav-pill">
          🚀 Coming Soon
        </a>
        {user && (
          <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            🎟️ My Tickets
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            ⚡ Admin Panel
          </NavLink>
        )}
        {user ? (
          <>
            <NavLink to="/profile" className="user-badge" title="Profile & Watchlist">
              <span className="avatar-icon">{user.name?.charAt(0).toUpperCase()}</span>
              <span>{user.name}</span>
            </NavLink>
            <button className="btn small outline" onClick={logout} title="Sign Out">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="btn small">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ToastProvider>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </ToastProvider>
  );
}
