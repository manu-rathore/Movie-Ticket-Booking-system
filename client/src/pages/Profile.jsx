import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getCountdownInfo } from '../utils/pricing.js';

export default function Profile() {
  const { user, updateUser, setCity } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferredCity: user?.preferredCity || 'All',
  });
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    api
      .get('/auth/me')
      .then((r) => {
        if (r.data?.user) {
          updateUser(r.data.user);
          setForm({
            name: r.data.user.name || '',
            phone: r.data.user.phone || '',
            preferredCity: r.data.user.preferredCity || 'All',
          });
        }
        setWatchlistMovies(r.data?.watchlistMovies || []);
      })
      .catch(() => {});

    api
      .get('/bookings/my')
      .then((r) => setBookings(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (user) loadData();
  }, []);

  if (!user) return <Navigate to="/login" />;

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/auth/profile', form);
      updateUser(r.data.user);
      setCity(r.data.user.preferredCity || 'All');
      showToast('Profile details update ho gayi! ✓', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      const r = await api.post(`/auth/watchlist/${movieId}`);
      updateUser({ ...user, watchlist: r.data.watchlist });
      setWatchlistMovies((prev) => prev.filter((m) => m._id !== movieId));
      showToast('Movie watchlist se remove ho gayi', 'info');
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalSpent = confirmedBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>👤 My Profile & Watchlist</h2>
        <p className="muted">Apni details manage karein aur saved movies dekhein</p>
      </div>

      {/* User Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{confirmedBookings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>₹{totalSpent.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saved Watchlist</div>
          <div className="stat-value" style={{ color: '#f43f5e' }}>{watchlistMovies.length}</div>
        </div>
      </div>

      <div className="two-col">
        {/* Profile Form */}
        <form className="card form" onSubmit={saveProfile}>
          <h3 style={{ marginTop: 0 }}>⚙️ Account Settings</h3>
          <span className="dim" style={{ fontSize: '12px' }}>Full Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <span className="dim" style={{ fontSize: '12px' }}>Email Address</span>
          <input value={user.email} disabled style={{ opacity: 0.7 }} />
          <span className="dim" style={{ fontSize: '12px' }}>Mobile Number</span>
          <input
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <span className="dim" style={{ fontSize: '12px' }}>Default City</span>
          <select
            value={form.preferredCity}
            onChange={(e) => setForm({ ...form, preferredCity: e.target.value })}
          >
            <option value="All">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Noida">Noida</option>
          </select>
          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Quick Actions / Info Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>🎟️ CineBook Member Pass</h3>
            <p className="muted" style={{ marginTop: '6px' }}>
              Aapke account par <b>{user.role === 'admin' ? 'Admin' : 'CineBook Member'}</b> privileges active hain.
            </p>
            <div style={{ marginTop: '18px', padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>🎁 Active Coupon Codes for You</div>
              <p className="dim">Checkout par in codes ka use karein:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                <span className="promo-mini-tag"><b>FIRST100</b> (₹100 off)</span>
                <span className="promo-mini-tag"><b>CINE20</b> (20% off)</span>
                <span className="promo-mini-tag"><b>POPCORN50</b> (₹50 off)</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Link to="/my-bookings" className="btn small" style={{ flex: 1 }}>
              View My Tickets →
            </Link>
            <Link to="/" className="btn small outline" style={{ flex: 1 }}>
              Browse Movies
            </Link>
          </div>
        </div>
      </div>

      {/* Watchlist Grid */}
      <h3>❤️ My Watchlist ({watchlistMovies.length})</h3>
      {watchlistMovies.length === 0 ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p className="muted">Aapne abhi koi movie save nahi ki hai. Movie cards par ❤️ dabakar save karein!</p>
        </div>
      ) : (
        <div className="grid">
          {watchlistMovies.map((m) => (
            <div key={m._id} className="card movie-card">
              <Link to={`/movie/${m._id}`} className="poster-wrapper">
                <img src={m.poster} alt={m.title} />
                {m.status === 'upcoming' && <span className="upcoming-badge">COMING SOON</span>}
                <span className="rating-badge">⭐ {m.rating || 8.0}</span>
              </Link>
              <div className="card-body">
                <div>
                  <Link to={`/movie/${m._id}`}>
                    <h3>{m.title}</h3>
                  </Link>
                  <p className="dim">
                    {m.status === 'upcoming'
                      ? getCountdownInfo(m.releaseDate).label
                      : `${m.genre} • ${m.language}`}
                  </p>
                </div>
                <div className="card-footer">
                  <Link to={`/movie/${m._id}`} className="book-btn-link">
                    {m.status === 'upcoming' ? 'Details →' : 'Book →'}
                  </Link>
                  <button
                    type="button"
                    className="btn small outline"
                    onClick={() => removeFromWatchlist(m._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
