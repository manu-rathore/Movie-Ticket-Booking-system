import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';

const emptyMovie = { title: '', description: '', poster: '', duration: '', genre: '', language: '', rating: '' };
const emptyShow = { movie: '', theatre: '', city: '', screen: 'Audi 1', startTime: '', price: '' };

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movie, setMovie] = useState(emptyMovie);
  const [show, setShow] = useState(emptyShow);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = () => {
    api.get('/movies').then((r) => setMovies(r.data)).catch(() => {});
    api.get('/bookings').then((r) => setBookings(r.data)).catch(() => {});
  };
  useEffect(load, []);

  const addMovie = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/movies', movie);
      alert('Movie safaltapoorvak add ho gayi! 🎬');
      setMovie(emptyMovie);
      load();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addShow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shows', show);
      alert('Show schedule ho gaya! 🎟️');
      setShow(emptyShow);
      load();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const delMovie = async (id) => {
    if (!confirm('Kya aap is movie aur iske sabhi shows ko delete karna chahte hain?')) return;
    try {
      await api.delete(`/movies/${id}`);
      load();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const m = (e) => setMovie({ ...movie, [e.target.name]: e.target.value });
  const s = (e) => setShow({ ...show, [e.target.name]: e.target.value });

  // Calculation for stats
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;

  const filteredBookings = bookings.filter((b) => {
    const q = searchTerm.toLowerCase();
    const userName = b.user?.name?.toLowerCase() || '';
    const movieTitle = b.show?.movie?.title?.toLowerCase() || '';
    return userName.includes(q) || movieTitle.includes(q);
  });

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2>⚡ Admin Command Center</h2>
        <p className="muted">Movies manage karein, show schedule karein aur booking revenue track karein</p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#10b981' }}>₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Movies</div>
          <div className="stat-value" style={{ color: '#f43f5e' }}>{movies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{bookings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed Tickets</div>
          <div className="stat-value" style={{ color: '#a855f7' }}>{confirmedBookingsCount}</div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="two-col">
        <form className="card form" onSubmit={addMovie}>
          <h3>🎬 Nayi Movie Add Karein</h3>
          <p className="muted" style={{ marginBottom: '8px', fontSize: '13px' }}>Catalogue me nayi movie register karein</p>
          <input name="title" placeholder="Movie Title (e.g. Inception)" value={movie.title} onChange={m} required />
          <input name="poster" placeholder="Poster Image URL" value={movie.poster} onChange={m} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input name="genre" placeholder="Genre (e.g. Action, Sci-Fi)" value={movie.genre} onChange={m} />
            <input name="language" placeholder="Language (e.g. Hindi)" value={movie.language} onChange={m} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input name="duration" type="number" placeholder="Duration (min)" value={movie.duration} onChange={m} />
            <input name="rating" type="number" step="0.1" placeholder="Rating (e.g. 8.5)" value={movie.rating} onChange={m} />
          </div>
          <textarea name="description" placeholder="Movie Plot Synopsis / Description" value={movie.description} onChange={m} />
          <button className="btn" disabled={submitting}>
            {submitting ? 'Adding...' : '+ Add Movie'}
          </button>
        </form>

        <form className="card form" onSubmit={addShow}>
          <h3>🎟️ Naya Show Schedule Karein</h3>
          <p className="muted" style={{ marginBottom: '8px', fontSize: '13px' }}>Theatre aur timing map karein</p>
          <select name="movie" value={show.movie} onChange={s} required>
            <option value="">-- Movie Chunein --</option>
            {movies.map((x) => (
              <option key={x._id} value={x._id}>
                {x.title} ({x.language || 'Hindi'})
              </option>
            ))}
          </select>
          <input name="theatre" placeholder="Theatre Name (e.g. PVR Cinemas)" value={show.theatre} onChange={s} required />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input name="city" placeholder="City (e.g. Mumbai, Delhi)" value={show.city} onChange={s} required />
            <input name="screen" placeholder="Screen / Audi" value={show.screen} onChange={s} />
          </div>
          <input name="startTime" type="datetime-local" value={show.startTime} onChange={s} required />
          <input name="price" type="number" placeholder="Ticket Price (₹)" value={show.price} onChange={s} required />
          <button className="btn" disabled={submitting}>
            {submitting ? 'Scheduling...' : '+ Schedule Show'}
          </button>
        </form>
      </div>

      {/* Movies List Management */}
      <div style={{ marginBottom: '36px' }}>
        <h3>🎬 Active Movies Management ({movies.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {movies.map((x) => (
            <div className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} key={x._id}>
              <div>
                <b>{x.title}</b>
                <div className="dim" style={{ fontSize: '12px', marginTop: '2px' }}>
                  {x.genre || 'Action'} • {x.language || 'Hindi'} • ⭐ {x.rating || 'N/A'}
                </div>
              </div>
              <button className="btn small danger" onClick={() => delMovie(x._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings Table with Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h3>📋 Customer Bookings ({bookings.length})</h3>
        <input
          placeholder="Customer ya Movie search karein..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px', margin: 0 }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Movie</th>
              <th>Showtime</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Koi booking nahi mili.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <b>{b.user?.name || 'Customer'}</b>
                    <div className="dim" style={{ fontSize: '12px' }}>{b.user?.email}</div>
                  </td>
                  <td><b>{b.show?.movie?.title || 'Movie'}</b></td>
                  <td>
                    {b.show && new Date(b.show.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <span style={{ color: '#f43f5e', fontWeight: 600 }}>{b.seats.join(', ')}</span>
                  </td>
                  <td>
                    <b style={{ color: '#10b981' }}>₹{b.totalAmount}</b>
                  </td>
                  <td>
                    <span className={`tag ${b.status}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
