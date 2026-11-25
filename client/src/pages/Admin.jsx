import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

const emptyMovie = {
  title: '',
  description: '',
  poster: '',
  duration: '',
  genre: '',
  language: '',
  rating: '',
  certificate: 'U/A',
  director: '',
  cast: '',
  formats: '2D, IMAX',
  trailerUrl: '',
  status: 'now_showing',
  releaseDate: '',
};

const emptyShow = { movie: '', theatre: '', city: '', screen: 'Audi 1', startTime: '', price: '' };

export default function Admin() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('movies'); // overview, movies, shows, bookings
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieFilter, setMovieFilter] = useState('all'); // all, now_showing, upcoming

  const [showForm, setShowForm] = useState(emptyShow);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState(null);

  const load = () => {
    api.get('/movies').then((r) => setMovies(r.data)).catch(() => {});
    api.get('/shows').then((r) => setShows(r.data)).catch(() => {});
    api.get('/bookings').then((r) => setBookings(r.data)).catch(() => {});
  };

  useEffect(load, []);

  const submitMovie = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMovieId) {
        await api.put(`/movies/${editingMovieId}`, movieForm);
        showToast('Movie update ho gayi! ✓', 'success');
      } else {
        await api.post('/movies', movieForm);
        showToast(
          movieForm.status === 'upcoming'
            ? '🚀 Movie Upcoming Panel me add ho gayi!'
            : '🎬 Nayi Movie Now Showing me add ho gayi!',
          'success'
        );
      }
      setMovieForm(emptyMovie);
      setEditingMovieId(null);
      load();
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditMovie = (m) => {
    setEditingMovieId(m._id);
    setMovieForm({
      title: m.title || '',
      description: m.description || '',
      poster: m.poster || '',
      duration: m.duration || '',
      genre: m.genre || '',
      language: m.language || '',
      rating: m.rating || '',
      certificate: m.certificate || 'U/A',
      director: m.director || '',
      cast: Array.isArray(m.cast) ? m.cast.join(', ') : m.cast || '',
      formats: Array.isArray(m.formats) ? m.formats.join(', ') : m.formats || '2D',
      trailerUrl: m.trailerUrl || '',
      status: m.status || 'now_showing',
      releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : '',
    });
    setActiveTab('movies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMovieStatus = async (m) => {
    const nextStatus = m.status === 'upcoming' ? 'now_showing' : 'upcoming';
    try {
      await api.put(`/movies/${m._id}`, { status: nextStatus });
      showToast(
        nextStatus === 'upcoming'
          ? `"${m.title}" ko Upcoming Panel me move kar diya gaya 🚀`
          : `"${m.title}" ab Now Showing me live hai 🎬`,
        'success'
      );
      load();
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const addShow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shows', showForm);
      showToast('Show schedule ho gaya! 🎟️', 'success');
      setShowForm(emptyShow);
      load();
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmedDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === 'movie') {
        await api.delete(`/movies/${confirmState.id}`);
        showToast('Movie aur uske shows delete ho gaye', 'info');
      } else if (confirmState.type === 'show') {
        await api.delete(`/shows/${confirmState.id}`);
        showToast('Showtime delete ho gaya', 'info');
      } else if (confirmState.type === 'booking') {
        await api.put(`/bookings/${confirmState.id}/cancel`);
        showToast('Booking cancel & refund kar di gayi', 'info');
      }
      load();
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setConfirmState(null);
    }
  };

  const mChange = (e) => setMovieForm({ ...movieForm, [e.target.name]: e.target.value });
  const sChange = (e) => setShowForm({ ...showForm, [e.target.name]: e.target.value });

  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const upcomingCount = movies.filter((m) => m.status === 'upcoming').length;

  const revenueByMovie = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      if (b.status !== 'confirmed') continue;
      const title = b.show?.movie?.title || 'Other';
      map[title] = (map[title] || 0) + (b.totalAmount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const filteredMovies = movies.filter((m) => {
    if (movieFilter === 'upcoming') return m.status === 'upcoming';
    if (movieFilter === 'now_showing') return !m.status || m.status === 'now_showing';
    return true;
  });

  const filteredBookings = bookings.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      (b.user?.name || '').toLowerCase().includes(q) ||
      (b.show?.movie?.title || '').toLowerCase().includes(q) ||
      (b.bookingCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0 }}>⚡ Admin Command Center</h2>
          <p className="muted">Now Showing, Upcoming Panel, Showtimes aur Bookings manage karein</p>
        </div>
        <button type="button" className="btn small outline" onClick={load}>
          🔄 Refresh Data
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#10b981' }}>₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Now Showing / Upcoming</div>
          <div className="stat-value" style={{ color: '#f43f5e' }}>
            {movies.length - upcomingCount} <span className="muted">/ {upcomingCount} 🚀</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Showtimes</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{shows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed Tickets</div>
          <div className="stat-value" style={{ color: '#a855f7' }}>{confirmedCount}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`genre-pill ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          🎬 Movies & Upcoming Panel
        </button>
        <button
          type="button"
          className={`genre-pill ${activeTab === 'shows' ? 'active' : ''}`}
          onClick={() => setActiveTab('shows')}
        >
          🎟️ Showtimes ({shows.length})
        </button>
        <button
          type="button"
          className={`genre-pill ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Bookings ({bookings.length})
        </button>
        <button
          type="button"
          className={`genre-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Revenue Analytics
        </button>
      </div>

      {/* TAB 1: MOVIES & UPCOMING PANEL */}
      {activeTab === 'movies' && (
        <>
          <form className="card form" onSubmit={submitMovie} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ marginTop: 0 }}>
                {editingMovieId ? '✏️ Edit Movie Details' : '🎬 Nayi Movie / Upcoming Release Add Karein'}
              </h3>
              {editingMovieId && (
                <button
                  type="button"
                  className="btn small outline"
                  onClick={() => {
                    setEditingMovieId(null);
                    setMovieForm(emptyMovie);
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="admin-form-grid">
              <div>
                <span className="dim">Movie Title *</span>
                <input name="title" placeholder="e.g. Pushpa 3 / Inception" value={movieForm.title} onChange={mChange} required />
              </div>
              <div>
                <span className="dim">Panel Placement (Status) *</span>
                <select name="status" value={movieForm.status} onChange={mChange}>
                  <option value="now_showing">🎬 Now Showing (Booking Open)</option>
                  <option value="upcoming">🚀 Upcoming Movies Panel (Coming Soon)</option>
                </select>
              </div>
              <div>
                <span className="dim">Release Date {movieForm.status === 'upcoming' ? '*' : ''}</span>
                <input
                  name="releaseDate"
                  type="date"
                  value={movieForm.releaseDate}
                  onChange={mChange}
                  required={movieForm.status === 'upcoming'}
                />
              </div>
              <div>
                <span className="dim">Poster Image URL</span>
                <input name="poster" placeholder="https://..." value={movieForm.poster} onChange={mChange} />
              </div>
              <div>
                <span className="dim">Trailer YouTube URL</span>
                <input name="trailerUrl" placeholder="https://www.youtube.com/watch?v=..." value={movieForm.trailerUrl} onChange={mChange} />
              </div>
              <div>
                <span className="dim">Genre</span>
                <input name="genre" placeholder="Action, Sci-Fi, Thriller, Comedy" value={movieForm.genre} onChange={mChange} />
              </div>
              <div>
                <span className="dim">Language</span>
                <input name="language" placeholder="Hindi, English" value={movieForm.language} onChange={mChange} />
              </div>
              <div>
                <span className="dim">Duration (mins) & Rating</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input name="duration" type="number" placeholder="145" value={movieForm.duration} onChange={mChange} />
                  <input name="rating" type="number" step="0.1" max="10" placeholder="8.5" value={movieForm.rating} onChange={mChange} />
                </div>
              </div>
              <div>
                <span className="dim">Certificate & Formats</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select name="certificate" value={movieForm.certificate} onChange={mChange}>
                    <option value="U">U</option>
                    <option value="U/A">U/A</option>
                    <option value="U/A 13+">U/A 13+</option>
                    <option value="U/A 16+">U/A 16+</option>
                    <option value="A">A</option>
                  </select>
                  <input name="formats" placeholder="2D, 3D, IMAX" value={movieForm.formats} onChange={mChange} />
                </div>
              </div>
              <div>
                <span className="dim">Director</span>
                <input name="director" placeholder="Director name" value={movieForm.director} onChange={mChange} />
              </div>
              <div>
                <span className="dim">Cast (comma separated)</span>
                <input name="cast" placeholder="Actor 1, Actor 2, Actor 3" value={movieForm.cast} onChange={mChange} />
              </div>
            </div>

            <span className="dim">Synopsis / Description</span>
            <textarea name="description" placeholder="Movie story summary..." value={movieForm.description} onChange={mChange} />

            <button className="btn" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Saving...' : editingMovieId ? '✓ Save Movie Changes' : '+ Add Movie'}
            </button>
          </form>

          {/* Movies Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>🎬 Manage Movies ({filteredMovies.length})</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className={`genre-pill ${movieFilter === 'all' ? 'active' : ''}`} onClick={() => setMovieFilter('all')}>
                All ({movies.length})
              </button>
              <button type="button" className={`genre-pill ${movieFilter === 'now_showing' ? 'active' : ''}`} onClick={() => setMovieFilter('now_showing')}>
                Now Showing ({movies.length - upcomingCount})
              </button>
              <button type="button" className={`genre-pill ${movieFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setMovieFilter('upcoming')}>
                🚀 Upcoming ({upcomingCount})
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {filteredMovies.map((x) => {
              const isUpcoming = x.status === 'upcoming';
              return (
                <div className="card admin-movie-card" key={x._id}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={x.poster || 'https://placehold.co/80x120/1e293b/ffffff?text=Film'}
                      alt={x.title}
                      style={{ width: '54px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className={`status-mini-pill ${isUpcoming ? 'upcoming' : 'live'}`}>
                        {isUpcoming ? '🚀 Upcoming' : '● Now Showing'}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '15.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                        {x.title}
                      </div>
                      <div className="dim" style={{ fontSize: '12px' }}>
                        {x.genre || 'Action'} • {x.language || 'Hindi'} • ⭐ {x.rating || '8.0'}
                      </div>
                      {x.releaseDate && (
                        <div className="dim" style={{ fontSize: '11.5px', color: '#38bdf8' }}>
                          Release: {new Date(x.releaseDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn small outline"
                      style={{ flex: 1 }}
                      onClick={() => toggleMovieStatus(x)}
                    >
                      {isUpcoming ? '🎬 Release Now' : '🚀 Mark Upcoming'}
                    </button>
                    <button type="button" className="btn small outline" onClick={() => startEditMovie(x)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn small danger"
                      onClick={() =>
                        setConfirmState({
                          type: 'movie',
                          id: x._id,
                          title: 'Delete Movie?',
                          message: `"${x.title}" aur iske saare scheduled shows permanently delete ho jayenge.`,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: SHOWTIMES */}
      {activeTab === 'shows' && (
        <div className="two-col">
          <form className="card form" onSubmit={addShow}>
            <h3 style={{ marginTop: 0 }}>🎟️ Naya Show Schedule Karein</h3>
            <p className="muted" style={{ marginBottom: '8px', fontSize: '13px' }}>
              Theatre, city, screen aur price assign karein
            </p>
            <select name="movie" value={showForm.movie} onChange={sChange} required>
              <option value="">-- Movie Chunein --</option>
              {movies.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.title} ({x.status === 'upcoming' ? 'Upcoming' : 'Now Showing'})
                </option>
              ))}
            </select>
            <input name="theatre" placeholder="Theatre Name (e.g. PVR IMAX)" value={showForm.theatre} onChange={sChange} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input name="city" placeholder="City (e.g. Mumbai)" value={showForm.city} onChange={sChange} required />
              <input name="screen" placeholder="Screen / Audi" value={showForm.screen} onChange={sChange} />
            </div>
            <input name="startTime" type="datetime-local" value={showForm.startTime} onChange={sChange} required />
            <input name="price" type="number" placeholder="Silver Base Price (₹)" value={showForm.price} onChange={sChange} required />
            <button className="btn" disabled={submitting}>
              {submitting ? 'Scheduling...' : '+ Schedule Show'}
            </button>
          </form>

          <div className="table-wrap" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Theatre & City</th>
                  <th>Showtime</th>
                  <th>Booked</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s._id}>
                    <td><b>{s.movie?.title || 'Movie'}</b></td>
                    <td>
                      {s.theatre}
                      <div className="dim">{s.city} • {s.screen} • ₹{s.price}</div>
                    </td>
                    <td>{new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{s.bookedSeats?.length || 0}/80</td>
                    <td>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() =>
                          setConfirmState({
                            type: 'show',
                            id: s._id,
                            title: 'Delete Showtime?',
                            message: `${s.movie?.title} (${s.theatre}) ka ye show remove karna hai?`,
                          })
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>📋 Customer Bookings ({bookings.length})</h3>
            <input
              placeholder="Customer, Movie ya Booking ID search karein..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '320px', margin: 0 }}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Customer</th>
                  <th>Movie & Show</th>
                  <th>Seats & Snacks</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      Koi booking nahi mili.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <span className="booking-code-pill">
                          {b.bookingCode || b._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <b>{b.user?.name || 'Customer'}</b>
                        <div className="dim" style={{ fontSize: '12px' }}>{b.user?.email}</div>
                      </td>
                      <td>
                        <b>{b.show?.movie?.title || 'Movie'}</b>
                        <div className="dim" style={{ fontSize: '12px' }}>
                          {b.show && new Date(b.show.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#f43f5e', fontWeight: 600 }}>{b.seats.join(', ')}</span>
                        {b.snacks?.length > 0 && (
                          <div className="dim" style={{ fontSize: '11.5px' }}>
                            +{b.snacks.reduce((acc, s) => acc + s.qty, 0)} snacks
                          </div>
                        )}
                      </td>
                      <td>
                        <b style={{ color: '#10b981' }}>₹{b.totalAmount}</b>
                        <div className="dim" style={{ fontSize: '11px' }}>{b.paymentMethod || 'UPI'}</div>
                      </td>
                      <td>
                        <span className={`tag ${b.status}`}>{b.status}</span>
                      </td>
                      <td>
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() =>
                              setConfirmState({
                                type: 'booking',
                                id: b._id,
                                title: 'Cancel Customer Ticket?',
                                message: `${b.user?.name} ki ${b.seats.join(', ')} seats cancel aur refund karein?`,
                              })
                            }
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 4: REVENUE ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0 }}>📊 Movie-wise Box Office Revenue</h3>
          {revenueByMovie.length === 0 ? (
            <p className="muted">Abhi confirmed bookings se koi revenue record nahi hai.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              {revenueByMovie.map(([title, rev]) => {
                const pct = Math.max(8, Math.round((rev / Math.max(1, totalRevenue)) * 100));
                return (
                  <div key={title}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                      <b>{title}</b>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>₹{rev.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="revenue-bar-bg">
                      <div className="revenue-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title || 'Confirm'}
        message={confirmState?.message || ''}
        confirmText="Yes, Proceed"
        danger
        onConfirm={handleConfirmedDelete}
        onCancel={() => setConfirmState(null)}
      />
    </>
  );
}
