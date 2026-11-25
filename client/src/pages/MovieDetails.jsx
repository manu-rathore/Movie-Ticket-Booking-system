import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  SNACKS_MENU,
  CONVENIENCE_FEE,
  getSeatTier,
  calculateSeatsTotal,
  getCountdownInfo,
} from '../utils/pricing.js';
import TrailerModal from '../components/TrailerModal.jsx';

const SEAT_SECTIONS = [
  { name: 'PLATINUM RECLINER', rows: ['H', 'G'], surcharge: 120, badgeClass: 'tier-platinum' },
  { name: 'GOLD EXECUTIVE', rows: ['F', 'E', 'D', 'C'], surcharge: 50, badgeClass: 'tier-gold' },
  { name: 'SILVER CLASSIC', rows: ['B', 'A'], surcharge: 0, badgeClass: 'tier-silver' },
];
const COLS = 10;
const MAX_SEATS = 10;

const dateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDatePill = (key) => {
  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  if (diff === 0) return { top: 'TODAY', bottom: label };
  if (diff === 1) return { top: 'TOMORROW', bottom: label };
  return { top: d.toLocaleDateString([], { weekday: 'short' }).toUpperCase(), bottom: d.toLocaleDateString([], { day: 'numeric', month: 'short' }) };
};

export default function MovieDetails() {
  const { id } = useParams();
  const { user, updateUser, city, setCity } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [show, setShow] = useState(null);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState('');
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Snacks & Promo state
  const [snacks, setSnacks] = useState({});
  const [showSnackModal, setShowSnackModal] = useState(false);
  const [promos, setPromos] = useState([]);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMsg, setPromoMsg] = useState('');

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [bank, setBank] = useState('HDFC Bank');

  // Review form state
  const [reviewRating, setReviewRating] = useState(9);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/movies/${id}`)
      .then((r) => setMovie(r.data))
      .catch((e) => setMsg(errMsg(e)));

    api
      .get('/bookings/promos')
      .then((r) => setPromos(r.data || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const cityQuery = city && city !== 'All' ? `?city=${encodeURIComponent(city)}` : '';
    api
      .get(`/shows/movie/${id}${cityQuery}`)
      .then((r) => {
        const list = r.data || [];
        setShows(list);
        if (list.length > 0) {
          const firstKey = dateKey(list[0].startTime);
          setSelectedDate(firstKey);
          pickShow(list[0]);
        } else {
          setSelectedDate('');
          setShow(null);
        }
      })
      .catch(() => {});
  }, [id, city]);

  const pickShow = async (s) => {
    try {
      const r = await api.get(`/shows/${s._id}`);
      setShow(r.data);
      setSelected([]);
      setMsg('');
    } catch {
      showToast('Updated seat data load nahi ho paya', 'error');
    }
  };

  const uniqueDates = useMemo(() => {
    const keys = [...new Set(shows.map((s) => dateKey(s.startTime)))];
    return keys;
  }, [shows]);

  const showsForDate = useMemo(() => {
    if (!selectedDate) return shows;
    return shows.filter((s) => dateKey(s.startTime) === selectedDate);
  }, [shows, selectedDate]);

  const theatresGrouped = useMemo(() => {
    const map = new Map();
    for (const s of showsForDate) {
      const key = `${s.theatre}__${s.city}__${s.screen || 'Audi 1'}`;
      if (!map.has(key)) {
        map.set(key, {
          theatre: s.theatre,
          city: s.city,
          screen: s.screen || 'Audi 1',
          slots: [],
        });
      }
      map.get(key).slots.push(s);
    }
    return Array.from(map.values());
  }, [showsForDate]);

  const toggleSeat = (seat) => {
    setSelected((prev) => {
      if (prev.includes(seat)) return prev.filter((x) => x !== seat);
      if (prev.length >= MAX_SEATS) {
        showToast(`Ek booking me maximum ${MAX_SEATS} seats select kar sakte hain`, 'warning');
        return prev;
      }
      return [...prev, seat];
    });
  };

  const updateSnackQty = (snackId, delta) => {
    setSnacks((prev) => {
      const current = prev[snackId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [snackId]: next };
    });
  };

  const ticketBasePrice = show?.price || 0;
  const seatsTotal = useMemo(() => calculateSeatsTotal(selected, ticketBasePrice), [selected, ticketBasePrice]);
  const snacksTotal = SNACKS_MENU.reduce((acc, item) => acc + (snacks[item.id] || 0) * item.price, 0);
  const convFee = selected.length ? CONVENIENCE_FEE : 0;
  const subtotalBeforeFee = seatsTotal + snacksTotal;
  const discountAmount = appliedPromo?.discount || 0;
  const grandTotal = Math.max(0, seatsTotal + snacksTotal + convFee - discountAmount);

  // Re-validate promo automatically if snacks or seats change
  useEffect(() => {
    if (!appliedPromo) return;
    api
      .post('/bookings/validate-promo', { code: appliedPromo.code, subtotal: subtotalBeforeFee })
      .then((r) => {
        setAppliedPromo(r.data);
        setPromoMsg('');
      })
      .catch(() => {
        setAppliedPromo(null);
      });
  }, [subtotalBeforeFee]);

  const applyPromoCode = async (codeToApply) => {
    const code = (codeToApply ?? promoInput).trim().toUpperCase();
    if (!code) return;
    setPromoInput(code);
    try {
      const r = await api.post('/bookings/validate-promo', { code, subtotal: subtotalBeforeFee });
      setAppliedPromo(r.data);
      setPromoMsg('');
      showToast(r.data.message, 'success');
    } catch (err) {
      setAppliedPromo(null);
      setPromoMsg(errMsg(err));
    }
  };

  const handleBookClick = () => {
    if (!user) {
      showToast('Ticket book karne ke liye pehle login karein', 'info');
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
    if (paymentMethod === 'card' && (!cardData.number.trim() || !cardData.expiry.trim() || !cardData.cvv.trim())) {
      showToast('Kripya card details complete bharein', 'warning');
      return;
    }

    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        const selectedSnacksList = SNACKS_MENU.filter((item) => (snacks[item.id] || 0) > 0).map((item) => ({
          name: item.name,
          qty: snacks[item.id],
          price: item.price,
        }));

        const res = await api.post('/bookings', {
          showId: show._id,
          seats: selected,
          snacks: selectedSnacksList,
          promoCode: appliedPromo?.code || '',
          paymentMethod: paymentMethod.toUpperCase(),
        });

        setPaymentProcessing(false);
        setShowPaymentModal(false);
        showToast(
          `🎉 Ticket Confirmed! Booking ID: ${res.data?.bookingCode || 'CONFIRMED'}`,
          'success'
        );
        navigate('/my-bookings');
      } catch (err) {
        setPaymentProcessing(false);
        setMsg(errMsg(err));
        showToast(errMsg(err), 'error');
        setShowPaymentModal(false);
        pickShow(show);
      }
    }, 1200);
  };

  const handleInterestToggle = async () => {
    if (!user) {
      showToast('Reminder set karne ke liye login karein', 'info');
      return navigate('/login');
    }
    try {
      const r = await api.post(`/movies/${movie._id}/interest`);
      setMovie((prev) => ({ ...prev, interestedUsers: r.data.interestedUsers }));
      showToast(
        r.data.interested ? '🔔 Release notification enabled!' : 'Notification removed',
        r.data.interested ? 'success' : 'info'
      );
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      showToast('Watchlist me save karne ke liye login karein', 'info');
      return navigate('/login');
    }
    try {
      const r = await api.post(`/auth/watchlist/${movie._id}`);
      updateUser({ ...user, watchlist: r.data.watchlist });
      showToast(r.data.saved ? '❤️ Watchlist me save ho gayi!' : 'Watchlist se hatayi gayi', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Review post karne ke liye login karein', 'info');
      return navigate('/login');
    }
    setReviewSubmitting(true);
    try {
      const r = await api.post(`/movies/${movie._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setMovie(r.data);
      setReviewComment('');
      showToast('Aapka review publish ho gaya! ⭐', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p className="muted">Movie details load ho rahi hain...</p>
      </div>
    );
  }

  const userId = user?.id || user?._id;
  const isUpcoming = movie.status === 'upcoming';
  const countdown = getCountdownInfo(movie.releaseDate);
  const interestedList = movie.interestedUsers || [];
  const isInterested = userId && interestedList.some((u) => String(u) === String(userId));
  const isSaved = (user?.watchlist || []).some((w) => String(w) === String(movie._id));

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {isUpcoming ? (
                <span className="hero-tag">🚀 Upcoming Release • {countdown.label}</span>
              ) : (
                <span className="hero-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  ● Now Showing in Cinemas
                </span>
              )}
              {movie.certificate && <span className="meta-chip">{movie.certificate}</span>}
            </div>

            <h1>{movie.title}</h1>

            <div className="details-meta-row" style={{ marginTop: '12px' }}>
              <span className="meta-chip rating">⭐ {movie.rating ? Number(movie.rating).toFixed(1) : '8.0'}/10</span>
              <span className="meta-chip">🎭 {movie.genre || 'Action'}</span>
              <span className="meta-chip">🌐 {movie.language || 'Hindi'}</span>
              <span className="meta-chip">⏱️ {movie.duration || 135} mins</span>
              {movie.formats?.length > 0 && <span className="meta-chip">🎞️ {movie.formats.join(', ')}</span>}
            </div>
          </div>

          <p className="details-desc">{movie.description || 'Action, romance aur adventure se bhari shandar movie.'}</p>

          {(movie.director || (movie.cast && movie.cast.length > 0)) && (
            <div className="cast-crew-box">
              {movie.director && (
                <div>
                  <span className="dim">Director: </span>
                  <b>{movie.director}</b>
                </div>
              )}
              {movie.cast?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                  <span className="dim">Cast: </span>
                  {movie.cast.map((actor) => (
                    <span key={actor} className="cast-pill">
                      {actor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            {movie.trailerUrl && (
              <button type="button" className="btn small" onClick={() => setTrailerOpen(true)}>
                ▶ Watch Trailer
              </button>
            )}
            <button
              type="button"
              className={`btn small outline ${isSaved ? 'watchlist-saved' : ''}`}
              onClick={handleWatchlistToggle}
            >
              {isSaved ? '❤️ Saved in Watchlist' : '🤍 Add to Watchlist'}
            </button>
            {isUpcoming && (
              <button
                type="button"
                className={`btn small ${isInterested ? 'notify-active' : 'outline'}`}
                onClick={handleInterestToggle}
              >
                {isInterested ? '🔔 Notified ✓' : '🔔 Notify Me'} ({interestedList.length + 120})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Notice Banner when no shows scheduled yet */}
      {isUpcoming && shows.length === 0 && (
        <div className="card upcoming-notice-box">
          <div>
            <h3>🚀 Coming Soon — Advance Booking Jald Khulegi!</h3>
            <p className="muted" style={{ marginTop: '4px' }}>
              Ye movie <b>{countdown.formatted || 'jald hi'}</b> cinemas me release hone wali hai. "Notify Me" par click karein taaki tickets open hote hi aapko pata chal sake!
            </p>
          </div>
          <button
            type="button"
            className={`btn ${isInterested ? 'notify-active' : ''}`}
            onClick={handleInterestToggle}
          >
            {isInterested ? '🔔 You Will Be Notified' : '🔔 Notify Me on Release'}
          </button>
        </div>
      )}

      {/* Shows Selection Section (Date Tabs + Theatre Grouped Time Slots) */}
      {(!isUpcoming || shows.length > 0) && (
        <div className="shows-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>
              1. Date & Showtime Chunein {city !== 'All' ? `(${city})` : ''}
            </h2>
            {city !== 'All' && (
              <button type="button" className="btn small outline" onClick={() => setCity('All')}>
                Show All Cities Instead
              </button>
            )}
          </div>

          {shows.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <p className="muted">
                {city !== 'All'
                  ? `${city} me abhi koi show available nahi hai.`
                  : 'Abhi is movie ke liye koi show schedule nahi hai.'}
              </p>
              {city !== 'All' && (
                <button className="btn small" style={{ marginTop: '12px' }} onClick={() => setCity('All')}>
                  View Shows in All Cities
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Date Selector Tabs */}
              <div className="date-pills">
                {uniqueDates.map((dKey) => {
                  const { top, bottom } = formatDatePill(dKey);
                  const active = selectedDate === dKey;
                  return (
                    <button
                      key={dKey}
                      type="button"
                      className={`date-pill ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDate(dKey);
                        const firstForDay = shows.find((s) => dateKey(s.startTime) === dKey);
                        if (firstForDay) pickShow(firstForDay);
                      }}
                    >
                      <span className="date-pill-top">{top}</span>
                      <span className="date-pill-bottom">{bottom}</span>
                    </button>
                  );
                })}
              </div>

              {/* Theatre Grouped Slots */}
              <div className="theatre-list">
                {theatresGrouped.map((grp) => (
                  <div key={`${grp.theatre}-${grp.city}-${grp.screen}`} className="card theatre-row">
                    <div className="theatre-info">
                      <div className="show-theatre">🏛️ {grp.theatre}</div>
                      <div className="show-city" style={{ marginBottom: 0 }}>
                        {grp.city} • {grp.screen}
                      </div>
                    </div>
                    <div className="time-slots">
                      {grp.slots.map((s) => {
                        const active = show?._id === s._id;
                        const bookedCount = s.bookedSeats?.length || 0;
                        const remaining = 80 - bookedCount;
                        const fillClass = remaining <= 0 ? 'sold' : remaining <= 20 ? 'fast' : 'avail';
                        return (
                          <button
                            key={s._id}
                            type="button"
                            disabled={remaining <= 0}
                            className={`time-slot-btn ${active ? 'active' : ''} ${fillClass}`}
                            onClick={() => pickShow(s)}
                          >
                            <span className="slot-time">
                              {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="slot-meta">
                              ₹{s.price}+ • {remaining <= 0 ? 'Full' : `${remaining} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Seat Picker Box */}
      {show && (
        <div className="card seat-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                2. Apni Seats Chunein ({show.theatre} • {show.screen})
              </h2>
              <span className="muted" style={{ fontSize: '13px' }}>
                {new Date(show.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Max {MAX_SEATS} seats
              </span>
            </div>
            {selected.length > 0 && (
              <button type="button" className="btn small outline" onClick={() => setSelected([])}>
                Clear Selection ({selected.length})
              </button>
            )}
          </div>

          <div className="screen-container">
            <div className="screen-visual" />
            <div className="screen-text">✨ ALL EYES THIS WAY • CINEMA SCREEN ✨</div>
          </div>

          <div className="seat-grid-container">
            {SEAT_SECTIONS.map((sec) => {
              const tierPrice = show.price + sec.surcharge;
              return (
                <div key={sec.name} className="seat-section-block">
                  <div className={`tier-header ${sec.badgeClass}`}>
                    <span>{sec.name}</span>
                    <b>₹{tierPrice}</b>
                  </div>
                  {sec.rows.map((r) => (
                    <div className="seat-row" key={r}>
                      <span className="row-label">{r}</span>
                      {Array.from({ length: COLS }, (_, i) => {
                        const seatNumber = `${r}${i + 1}`;
                        const booked = show.bookedSeats && show.bookedSeats.includes(seatNumber);
                        const sel = selected.includes(seatNumber);
                        const aisleAfter = i === 4;
                        return (
                          <button
                            key={seatNumber}
                            type="button"
                            disabled={booked}
                            className={`seat ${sec.badgeClass} ${booked ? 'booked' : ''} ${sel ? 'selected' : ''} ${aisleAfter ? 'aisle-right' : ''}`}
                            onClick={() => toggleSeat(seatNumber)}
                            title={booked ? `${seatNumber} (Booked)` : `${seatNumber} • ${sec.name} (₹${tierPrice})`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                      <span className="row-label">{r}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Seat Legend */}
          <div className="legend">
            <div className="legend-item">
              <span className="legend-sample avail" />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample plat" />
              <span>Platinum Recliner (+₹120)</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample sel" />
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample book" />
              <span>Booked</span>
            </div>
          </div>

          {msg && <p className="error">{msg}</p>}

          {/* Bottom Sticky Action Bar */}
          <div className="booking-summary-bar">
            <div className="summary-details">
              <span className="muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Selected Seats ({selected.length}/{MAX_SEATS})
              </span>
              <span className="selected-seats-badge">
                {selected.length > 0
                  ? selected.map((s) => `${s} (₹${getSeatTier(s, show.price).price})`).join(', ')
                  : 'Koi seat select nahi ki'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span className="muted" style={{ fontSize: '12px' }}>Seats Subtotal</span>
                <div className="summary-price">₹{seatsTotal}</div>
              </div>
              <button
                className="btn"
                disabled={!selected.length}
                onClick={handleBookClick}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audience Reviews & Ratings Section */}
      <section className="reviews-section">
        <h2>⭐ Audience Reviews & Ratings ({movie.reviews?.length || 0})</h2>
        <div className="two-col" style={{ marginTop: '12px' }}>
          <form className="card form" onSubmit={submitReview}>
            <h3 style={{ marginTop: 0 }}>Apna Review Likhein</h3>
            <label className="dim" style={{ fontSize: '12.5px', marginTop: '6px' }}>
              Aapki Rating: <b style={{ color: '#fbbf24' }}>{reviewRating}/10 ⭐</b>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              style={{ accentColor: '#f43f5e', padding: 0 }}
            />
            <textarea
              placeholder="Movie kaisi lagi? Story, music ya acting ke baare me likhein..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required
            />
            <button className="btn small" disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>

          <div className="reviews-list">
            {(!movie.reviews || movie.reviews.length === 0) ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p className="muted">Abhi tak koi review nahi hai. Sabse pehla review likhein!</p>
              </div>
            ) : (
              movie.reviews.map((rev, idx) => (
                <div key={rev._id || idx} className="card review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="avatar-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                        {rev.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                      <b>{rev.name}</b>
                    </div>
                    <span className="rating-pill-sm">⭐ {rev.rating}/10</span>
                  </div>
                  <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5 }}>{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Snacks & Promo Codes Modal */}
      {showSnackModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSnackModal(false);
          }}
        >
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>🍿 Snacks & Promo Offers</h2>
              <button
                className="btn small outline"
                onClick={() => setShowSnackModal(false)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

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

            {/* Promo Code Section */}
            <div className="promo-box">
              <span className="dim" style={{ fontSize: '12px', fontWeight: 600 }}>🎟️ APPLY PROMO CODE</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  placeholder="Enter code (e.g. FIRST100)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  style={{ margin: 0 }}
                />
                <button
                  type="button"
                  className="btn small"
                  onClick={() => applyPromoCode()}
                >
                  Apply
                </button>
              </div>
              {promoMsg && <p className="error" style={{ marginTop: '8px', marginBottom: 0 }}>{promoMsg}</p>}
              {appliedPromo && (
                <div className="promo-applied-badge">
                  <span>✓ {appliedPromo.message}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoInput('');
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
              {promos.length > 0 && !appliedPromo && (
                <div className="promo-suggestions">
                  {promos.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      className="promo-mini-tag"
                      onClick={() => applyPromoCode(p.code)}
                      title={p.description}
                    >
                      Use <b>{p.code}</b>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bill-breakdown">
              <div className="bill-row">
                <span className="muted">Tickets ({selected.length} seats)</span>
                <span>₹{seatsTotal}</span>
              </div>
              {snacksTotal > 0 && (
                <div className="bill-row" style={{ color: '#38bdf8' }}>
                  <span>Snacks & Drinks</span>
                  <span>+₹{snacksTotal}</span>
                </div>
              )}
              <div className="bill-row">
                <span className="muted">Convenience & Booking Fee</span>
                <span>+₹{convFee}</span>
              </div>
              {discountAmount > 0 && (
                <div className="bill-row" style={{ color: '#10b981', fontWeight: 600 }}>
                  <span>Promo Discount ({appliedPromo?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="bill-row bill-total">
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
                Back
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
        <div className="modal-overlay" role="dialog" aria-modal="true">
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

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="muted" style={{ fontSize: '12px' }}>Amount to Pay</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>₹{grandTotal}</div>
              </div>
              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                {selected.length} Seats • {show.theatre}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                className={`btn outline small ${paymentMethod === 'upi' ? 'active' : ''}`}
                style={{
                  borderColor: paymentMethod === 'upi' ? '#f43f5e' : 'var(--border-glass)',
                  background: paymentMethod === 'upi' ? 'rgba(244,63,94,0.15)' : 'transparent',
                  color: paymentMethod === 'upi' ? '#fff' : 'var(--text-muted)',
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
                  color: paymentMethod === 'card' ? '#fff' : 'var(--text-muted)',
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
                  color: paymentMethod === 'netbanking' ? '#fff' : 'var(--text-muted)',
                }}
                onClick={() => setPaymentMethod('netbanking')}
              >
                🏦 NetBanking
              </button>
            </div>

            {paymentMethod === 'upi' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '12px', color: '#000', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>Scan with Any UPI App</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>GPay • PhonePe • Paytm • BHIM</div>
                  <div style={{ margin: '0 auto', width: '120px', height: '120px', background: '#f1f5f9', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <span style={{ fontSize: '44px' }}>📲</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>QR Code valid for 5 mins</div>
                </div>
                <input
                  placeholder="Or enter UPI ID (e.g. name@okhdfcbank)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{ margin: 0 }}
                />
              </div>
            )}

            {paymentMethod === 'card' && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  placeholder="Card Number (4532 •••• •••• 8892)"
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                  />
                </div>
                <input
                  placeholder="Cardholder Name"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                />
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div style={{ marginBottom: '16px' }}>
                <span className="dim" style={{ fontSize: '12px' }}>Select Bank</span>
                <select value={bank} onChange={(e) => setBank(e.target.value)} style={{ marginTop: '6px' }}>
                  <option>HDFC Bank</option>
                  <option>State Bank of India (SBI)</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            <button
              className="btn"
              style={{ width: '100%', padding: '14px' }}
              disabled={paymentProcessing}
              onClick={processPaymentAndConfirm}
            >
              {paymentProcessing ? '🔄 Verifying Payment...' : `Pay ₹${grandTotal} & Confirm Tickets 🎟️`}
            </button>
          </div>
        </div>
      )}

      <TrailerModal movie={trailerOpen ? movie : null} onClose={() => setTrailerOpen(false)} />
    </>
  );
}
