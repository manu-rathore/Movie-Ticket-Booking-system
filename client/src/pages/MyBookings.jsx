import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function TicketQR({ code }) {
  const seed = String(code || 'CINEBOOK');
  const cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      const charCode = seed.charCodeAt((r * 9 + c) % seed.length);
      const filled = isCorner ? !(r === 1 && c === 1) : (charCode + r * 3 + c * 7) % 2 === 0;
      cells.push({ r, c, filled });
    }
  }
  return (
    <svg width="78" height="78" viewBox="0 0 90 90" aria-label="Ticket QR Code" style={{ background: '#fff', padding: '5px', borderRadius: '6px' }}>
      {cells.map(
        (cell) =>
          cell.filled && (
            <rect
              key={`${cell.r}-${cell.c}`}
              x={cell.c * 10}
              y={cell.r * 10}
              width="8.5"
              height="8.5"
              rx="1.5"
              fill="#0f172a"
            />
          )
      )}
    </svg>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/bookings/my')
      .then((r) => setBookings(r.data))
      .catch(() => showToast('Bookings load karne me issue aaya', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.put(`/bookings/${cancelTarget._id}/cancel`);
      showToast('Booking cancel ho gayi aur seats release kar di gayi hain.', 'success');
      setCancelTarget(null);
      load();
    } catch (err) {
      showToast(errMsg(err), 'error');
      setCancelTarget(null);
    }
  };

  const filtered = bookings.filter((b) => (filter === 'all' ? true : b.status === filter));

  return (
    <>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0 }}>🎟️ My Booked Tickets</h2>
          <p className="muted">Aapki saari current aur purani bookings yahan hain</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`genre-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            className={`genre-pill ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
          </button>
          <button
            type="button"
            className={`genre-pill ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
          </button>
          <button className="btn small outline" onClick={load}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="no-print">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p className="muted">Bookings load ho rahi hain...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: '20px 0' }}>
            <h3>Koi booking nahi mili 🍿</h3>
            <p className="muted" style={{ marginTop: '8px' }}>
              Nayi movies explore karein aur apni pasandida seats book karein!
            </p>
            <Link to="/" className="btn small" style={{ marginTop: '16px' }}>
              Explore Movies Now
            </Link>
          </div>
        ) : (
          filtered.map((b) => {
            const showDate = b.show?.startTime ? new Date(b.show.startTime) : null;
            const ticketCode = b.bookingCode || b._id?.slice(-6).toUpperCase();
            return (
              <div className="card booking-card" key={b._id}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {b.show?.movie?.poster && (
                    <img
                      src={b.show.movie.poster}
                      alt={b.show.movie.title}
                      style={{ width: '64px', height: '94px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span className="booking-code-pill">#{ticketCode}</span>
                      <span className="dim" style={{ fontSize: '12px' }}>
                        {b.paymentMethod || 'UPI'} • {b.paymentStatus === 'refunded' ? 'Refunded' : 'Paid'}
                      </span>
                    </div>
                    <div className="booking-title">
                      🎬 {b.show?.movie?.title || 'Movie'}
                    </div>
                    <p className="muted" style={{ marginBottom: '4px' }}>
                      🏛️ <b>{b.show?.theatre}</b>, {b.show?.city} • {b.show?.screen || 'Screen 1'}
                    </p>
                    <p className="muted" style={{ marginBottom: '6px' }}>
                      📅 {showDate ? `${showDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                    </p>
                    <p style={{ fontSize: '14.5px' }}>
                      Seats: <b style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{b.seats.join(', ')}</b>
                      {' '} | Total: <b style={{ color: '#10b981' }}>₹{b.totalAmount}</b>
                      {b.discountAmount > 0 && (
                        <span className="dim" style={{ marginLeft: '8px', color: '#38bdf8' }}>
                          (Saved ₹{b.discountAmount} via {b.promoCode})
                        </span>
                      )}
                    </p>
                    {b.snacks?.length > 0 && (
                      <p className="dim" style={{ marginTop: '4px', fontSize: '12.5px' }}>
                        🍿 Snacks: {b.snacks.map((s) => `${s.name} x${s.qty}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <span className={`tag ${b.status}`}>
                    {b.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {b.status === 'confirmed' && (
                      <>
                        <button className="btn small outline" onClick={() => setActiveTicket(b)}>
                          View Digital Pass 📱
                        </button>
                        <button className="btn small danger" onClick={() => setCancelTarget(b)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Digital Pass / E-Ticket Modal */}
      {activeTicket && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTicket(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Digital Cinema Ticket</h3>
              <button
                className="btn small outline"
                onClick={() => setActiveTicket(null)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <div className="ticket-pass" id="printable-ticket">
              <div className="ticket-pass-header">
                <span className="hero-tag" style={{ fontSize: '11px', marginBottom: '8px' }}>
                  CineBook Official Entry Pass
                </span>
                <h2 style={{ fontSize: '22px', margin: '4px 0 2px' }}>{activeTicket.show?.movie?.title}</h2>
                <span className="muted" style={{ fontSize: '13px' }}>
                  {activeTicket.show?.theatre}, {activeTicket.show?.city}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13.5px', marginBottom: '14px' }}>
                <div>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>DATE & TIME</span>
                  <div style={{ fontWeight: 600 }}>
                    {activeTicket.show && new Date(activeTicket.show.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    <br />
                    {activeTicket.show && new Date(activeTicket.show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>SCREEN</span>
                  <div style={{ fontWeight: 600 }}>{activeTicket.show?.screen || 'Audi 1'}</div>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>SEAT NUMBERS</span>
                  <div style={{ fontWeight: 700, color: '#f43f5e' }}>{activeTicket.seats.join(', ')}</div>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>TOTAL PAID</span>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>
                    ₹{activeTicket.totalAmount} ({activeTicket.paymentMethod || 'UPI'})
                  </div>
                </div>
              </div>

              {activeTicket.snacks?.length > 0 && (
                <div style={{ fontSize: '12.5px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', marginBottom: '14px' }}>
                  <b>🍿 Snacks Pre-ordered:</b>{' '}
                  {activeTicket.snacks.map((s) => `${s.name} x${s.qty}`).join(', ')}
                </div>
              )}

              {/* QR Section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#fff', color: '#0f172a', padding: '12px 14px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1px' }}>
                    BOOKING REFERENCE
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'monospace' }}>
                    {activeTicket.bookingCode || activeTicket._id?.slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Scan QR at theatre entry gate
                  </div>
                </div>
                <TicketQR code={activeTicket.bookingCode || activeTicket._id} />
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn outline" style={{ flex: 1 }} onClick={() => setActiveTicket(null)}>
                Close
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ Print Pass
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Booking?"
        message={`Kya aap "${cancelTarget?.show?.movie?.title}" (${cancelTarget?.seats?.join(', ')}) ki booking cancel karna chahte hain? Refund initiate ho jayega aur seats release ho jayengi.`}
        confirmText="Yes, Cancel Ticket"
        cancelText="Keep Ticket"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
