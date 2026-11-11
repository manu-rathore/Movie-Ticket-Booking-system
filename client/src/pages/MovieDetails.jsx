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

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, netbanking
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

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
  const convFee = selected.length ? 30 : 0; // Convenience fee
  const grandTotal = seatsTotal + snacksTotal + convFee;

  const handleBookClick = () => {
    if (!user) {
      return navigate('/login');
    }
    setShowSnackModal(true);
  };

  const proceedToPayment = () => {
    setShowSnackModal(false);
    setShowPaymentModal(true);
  };

  const processPaymentAndConfirm = async (e) => {
    if (e) e.preventDefault();
    setPaymentProcessing(true);

    // Simulate real gateway processing delay (1.5 seconds)
    setTimeout(async () => {
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
          paymentMethod: paymentMethod.toUpperCase(),
        });

        setPaymentProcessing(false);
        setShowPaymentModal(false);
        alert('🎉 Payment Successful! Aapki ticket confirm ho gayi hai!');
        navigate('/my-bookings');
      } catch (err) {
        setPaymentProcessing(false);
        setMsg(errMsg(err));
        setShowPaymentModal(false);
        pickShow(show);
      }
    }, 1500);
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

      {/* Snacks Modal */}
      {showSnackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>🍿 Add Snacks & Combos</h2>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px', color: '#94a3b8' }}>
                <span>Convenience & Service Fee</span>
                <span>+₹{convFee}</span>
              </div>
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
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 2 }}
                onClick={proceedToPayment}
              >
                Proceed to Pay ₹{grandTotal} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔒 Secure Checkout
                </h3>
                <span className="muted" style={{ fontSize: '12px' }}>256-Bit Encrypted Payment</span>
              </div>
              <button
                className="btn small outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentProcessing}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            {/* Total Amount Tag */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="muted" style={{ fontSize: '12px' }}>Amount to Pay</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>₹{grandTotal}</div>
              </div>
              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                {selected.length} Tickets
              </span>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                className={`btn outline small ${paymentMethod === 'upi' ? 'active' : ''}`}
                style={{
                  borderColor: paymentMethod === 'upi' ? '#f43f5e' : 'var(--border-glass)',
                  background: paymentMethod === 'upi' ? 'rgba(244,63,94,0.15)' : 'transparent',
                  color: paymentMethod === 'upi' ? '#fff' : 'var(--text-muted)'
                }}
                onClick={() => setPaymentMethod('upi')}
              >
                📱 UPI / QR
              </button>
              <button
                type="button"
                className={`btn outline small ${paymentMethod === 'card' ? 'active' : ''}`}
                style={{
                  borderColor: paymentMethod === 'card' ? '#f43f5e' : 'var(--border-glass)',
                  background: paymentMethod === 'card' ? 'rgba(244,63,94,0.15)' : 'transparent',
                  color: paymentMethod === 'card' ? '#fff' : 'var(--text-muted)'
                }}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Cards
              </button>
              <button
                type="button"
                className={`btn outline small ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                style={{
                  borderColor: paymentMethod === 'netbanking' ? '#f43f5e' : 'var(--border-glass)',
                  background: paymentMethod === 'netbanking' ? 'rgba(244,63,94,0.15)' : 'transparent',
                  color: paymentMethod === 'netbanking' ? '#fff' : 'var(--text-muted)'
                }}
                onClick={() => setPaymentMethod('netbanking')}
              >
                🏦 NetBanking
              </button>
            </div>

            {/* Dynamic Payment Method Forms */}
            {paymentMethod === 'upi' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '12px', color: '#000', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>Scan with Any UPI App</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>GPay • PhonePe • Paytm • BHIM</div>
                  <div style={{ margin: '0 auto', width: '130px', height: '130px', background: '#f1f5f9', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <span style={{ fontSize: '48px' }}>📲</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>QR Code valid for 5 mins</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
                  <span className="muted" style={{ fontSize: '12px' }}>Or enter UPI ID:</span>
                </div>
                <input
                  placeholder="username@okhdfcbank / paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{ margin: 0 }}
                />
              </div>
            )}

            {paymentMethod === 'card' && (
              <div style={{ marginBottom: '16px' }}>
                <div>
                  <span className="dim" style={{ fontSize: '12px' }}>Card Number</span>
                  <input
                    placeholder="4532 •••• •••• 8892"
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span className="dim" style={{ fontSize: '12px' }}>Expiry</span>
                    <input
                      placeholder="MM / YY"
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="dim" style={{ fontSize: '12px' }}>CVV</span>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <span className="dim" style={{ fontSize: '12px' }}>Cardholder Name</span>
                  <input
                    placeholder="Name on card"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div style={{ marginBottom: '16px' }}>
                <span className="dim" style={{ fontSize: '12px' }}>Select Popular Bank</span>
                <select style={{ marginTop: '6px' }}>
                  <option>HDFC Bank</option>
                  <option>State Bank of India (SBI)</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                  <option>Punjab National Bank</option>
                </select>
              </div>
            )}

            <button
              className="btn"
              style={{ width: '100%', padding: '14px' }}
              disabled={paymentProcessing}
              onClick={processPaymentAndConfirm}
            >
              {paymentProcessing ? (
                <span>🔄 Verifying Payment with Bank...</span>
              ) : (
                <span>Pay ₹{grandTotal} & Confirm Tickets 🎟️</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
