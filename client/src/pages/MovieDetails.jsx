import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROWS = 'ABCDEFGH'.split('');
const COLS = 10;

const SNACKS_MENU = [
  { id: 'popcorn', name: 'Caramel Popcorn', price: 180, emoji: '🍿' },
  { id: 'coke', name: 'Chilled Pepsi (Large)', price: 120, emoji: '🥤' },
  { id: 'nachos', name: 'Cheesy Jalapeño Nachos', price: 160, emoji: '🧀' },
  { id: 'burger', name: 'Crispy Veg Burger', price: 150, emoji: '🍔' },
];

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [show, setShow] = useState(null);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Snacks & Beverage addon state
  const [snacks, setSnacks] = useState({});
  const [showSnackModal, setShowSnackModal] = useState(false);

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then((r) => setMovie(r.data))
      .catch((e) => setMsg(errMsg(e)));

    api.get(`/shows/movie/${id}`)
      .then((r) => {
        setShows(r.data);
        if (r.data && r.data.length > 0) {
          pickShow(r.data[0]);
        }
      })
      .catch(() => {});
  }, [id]);

  const pickShow = async (s) => {
    try {
      const r = await api.get(`/shows/${s._id}`);
      setShow(r.data);
      setSelected([]);
      setMsg('');
    } catch (e) {
      setMsg('Could not fetch updated seat data');
    }
  };

  const toggle = (seat) => {
    setSelected((prev) =>
      prev.includes(seat) ? prev.filter((x) => x !== seat) : [...prev, seat]
    );
  };

  const updateSnackQty = (snackId, delta) => {
    setSnacks((prev) => {
      const current = prev[snackId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [snackId]: next };
    });
  };

  const snacksTotal = SNACKS_MENU.reduce((acc, item) => {
    return acc + (snacks[item.id] || 0) * item.price;
  }, 0);

  const ticketPrice = show?.price || 0;
  const seatsTotal = selected.length * ticketPrice;
  const grandTotal = seatsTotal + snacksTotal;

  const handleBookClick = () => {
    if (!user) {
      return navigate('/login');
    }
    setShowSnackModal(true);
  };

  const confirmBooking = async () => {
    setBookingLoading(true);
    try {
      const selectedSnacksList = SNACKS_MENU
        .filter((item) => (snacks[item.id] || 0) > 0)
        .map((item) => ({
          name: item.name,
          qty: snacks[item.id],
          price: item.price,
        }));

      await api.post('/bookings', {
        showId: show._id,
        seats: selected,
        snacks: selectedSnacksList,
        totalAmount: grandTotal,
      });

      setShowSnackModal(false);
      alert('🎉 Badhai ho! Aapki ticket confirm ho gayi hai!');
      navigate('/my-bookings');
    } catch (err) {
      setMsg(errMsg(err));
      setShowSnackModal(false);
      pickShow(show);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p className="muted">Movie details load ho rahi hain...</p>
      </div>
    );
  }

  return (
    <>
      {/* Movie Details Banner */}
      <div className="details-hero">
        <img
          src={movie.poster || 'https://placehold.co/300x450/1e293b/ffffff?text=CineBook'}
          alt={movie.title}
          className="details-poster"
          onError={(e) => {
            e.target.src = 'https://placehold.co/300x450/1e293b/ffffff?text=CineBook';
          }}
        />
        <div className="details-info">
          <div>
            <h1>{movie.title}</h1>
            <div className="details-meta-row" style={{ marginTop: '12px' }}>
              <span className="meta-chip rating">⭐ {movie.rating ? Number(movie.rating).toFixed(1) : '8.0'}</span>
              <span className="meta-chip">🎭 {movie.genre || 'Action'}</span>
              <span className="meta-chip">🌐 {movie.language || 'Hindi'}</span>
              <span className="meta-chip">⏱️ {movie.duration || 135} mins</span>
              <span className="meta-chip">🎬 Dolby Atmos 7.1</span>
            </div>
          </div>
          <p className="details-desc">{movie.description || 'Action, romance aur adventure se bhari shandar movie.'}</p>
        </div>
      </div>

      {/* Shows Selection Section */}
      <div className="shows-section">
        <h2>1. Available Showtime Chunein</h2>
        {shows.length === 0 ? (
          <p className="muted">Abhi is movie ke liye koi show schedule nahi hai.</p>
        ) : (
          <div className="show-list">
            {shows.map((s) => {
              const active = show?._id === s._id;
              const dateObj = new Date(s.startTime);
              return (
                <div
                  key={s._id}
                  className={`show-card ${active ? 'active' : ''}`}
                  onClick={() => pickShow(s)}
                >
                  <div className="show-theatre">🏛️ {s.theatre}</div>
                  <div className="show-city">{s.city} • {s.screen || 'Audi 1'}</div>
                  <div className="show-time-price">
                    <span className="show-time">
                      📅 {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                      {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="show-price">₹{s.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seat Picker Box */}
      {show && (
        <div className="card seat-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <h2>2. Apni Seats Chunein ({show.theatre} - {show.screen})</h2>
            <span className="muted" style={{ fontSize: '13px' }}>Price: ₹{show.price} / ticket</span>
          </div>

          <div className="screen-container">
            <div className="screen-visual" />
            <div className="screen-text">✨ ALL EYES THIS WAY • CINEMA SCREEN ✨</div>
          </div>

          <div className="seat-grid-container">
            {ROWS.map((r) => (
              <div className="seat-row" key={r}>
                <span className="row-label">{r}</span>
                {Array.from({ length: COLS }, (_, i) => {
                  const seatNumber = `${r}${i + 1}`;
                  const booked = show.bookedSeats && show.bookedSeats.includes(seatNumber);
                  const sel = selected.includes(seatNumber);
                  return (
                    <button
                      key={seatNumber}
                      disabled={booked}
                      className={`seat ${booked ? 'booked' : ''} ${sel ? 'selected' : ''}`}
                      onClick={() => toggle(seatNumber)}
                      title={booked ? `${seatNumber} (Booked)` : `${seatNumber} (₹${show.price})`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Seat Legend */}
          <div className="legend">
            <div className="legend-item">
              <span className="legend-sample avail" />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample sel" />
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample book" />
              <span>Already Booked</span>
            </div>
          </div>

          {msg && <p className="error">{msg}</p>}

          {/* Bottom Sticky Action Bar */}
          <div className="booking-summary-bar">
            <div className="summary-details">
              <span className="muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Selected Seats ({selected.length})
              </span>
              <span className="selected-seats-badge">
                {selected.length > 0 ? selected.join(', ') : 'Koi seat select nahi ki'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span className="muted" style={{ fontSize: '12px' }}>Total Amount</span>
                <div className="summary-price">₹{seatsTotal}</div>
              </div>
              <button
                className="btn"
                disabled={!selected.length || bookingLoading}
                onClick={handleBookClick}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snacks & Checkout Modal */}
      {showSnackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>🍿 Add Snacks & Confirm</h2>
              <button
                className="btn small outline"
                onClick={() => setShowSnackModal(false)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ fontSize: '13.5px', marginBottom: '12px' }}>
              Apne movie experience ko aur zabardast banayein snacks ke sath!
            </p>

            {/* Snacks options */}
            <div className="snack-grid">
              {SNACKS_MENU.map((item) => (
                <div key={item.id} className="snack-card">
                  <span className="snack-emoji">{item.emoji}</span>
                  <b style={{ fontSize: '13px' }}>{item.name}</b>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>₹{item.price}</span>
                  <div className="snack-counter">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateSnackQty(item.id, -1)}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                      {snacks[item.id] || 0}
                    </span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateSnackQty(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', margin: '18px 0', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
                <span className="muted">Tickets ({selected.length} seats)</span>
                <span>₹{seatsTotal}</span>
              </div>
              {snacksTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px', color: '#38bdf8' }}>
                  <span>Snacks & Drinks</span>
                  <span>+₹{snacksTotal}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Final Payable</span>
                <span style={{ color: '#10b981' }}>₹{grandTotal}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn outline"
                style={{ flex: 1 }}
                onClick={() => setShowSnackModal(false)}
                disabled={bookingLoading}
              >
                Back
              </button>
              <button
                className="btn"
                style={{ flex: 2 }}
                onClick={confirmBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Processing...' : `Pay ₹${grandTotal} & Confirm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
