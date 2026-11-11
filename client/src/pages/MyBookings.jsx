import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/bookings/my')
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const cancel = async (id) => {
    if (!confirm('Kya aap sach me ye booking cancel karna chahte hain? Refund policy ke mutabik seats release ho jayengi.')) {
      return;
    }
    try {
      await api.put(`/bookings/${id}/cancel`);
      alert('Booking safaltapoorvak cancel ho gayi.');
      load();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const downloadTicket = (b) => {
    window.print();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>🎟️ My Booked Tickets</h2>
          <p className="muted">Aapki sari current aur purani bookings yahan hain</p>
        </div>
        <button className="btn small outline" onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="muted">Bookings load ho rahi hain...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: '20px 0' }}>
          <h3>Abhi tak koi booking nahi hai 🍿</h3>
          <p className="muted" style={{ marginTop: '8px' }}>
            Nayi movies explore karein aur apni pasandida seats book karein!
          </p>
          <a href="/" className="btn small" style={{ marginTop: '16px' }}>
            Explore Movies Now
          </a>
        </div>
      ) : (
        bookings.map((b) => {
          const showDate = b.show?.startTime ? new Date(b.show.startTime) : null;
          return (
            <div className="card booking-card" key={b._id}>
              <div>
                <div className="booking-title">
                  🎬 {b.show?.movie?.title || 'Movie'}
                </div>
                <p className="muted" style={{ marginBottom: '6px' }}>
                  🏛️ <b>{b.show?.theatre}</b>, {b.show?.city} • {b.show?.screen || 'Screen 1'}
                </p>
                <p className="muted" style={{ marginBottom: '8px' }}>
                  📅 {showDate ? `${showDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                </p>
                <p style={{ fontSize: '15px' }}>
                  Selected Seats: <b style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{b.seats.join(', ')}</b> | Total: <b style={{ color: '#10b981' }}>₹{b.totalAmount}</b>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                <span className={`tag ${b.status}`}>
                  {b.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {b.status === 'confirmed' && (
                    <>
                      <button
                        className="btn small outline"
                        onClick={() => setActiveTicket(b)}
                      >
                        View Digital Pass 📱
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => cancel(b._id)}
                      >
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

      {/* Digital Pass / E-Ticket Modal */}
      {activeTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
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
                <span className="hero-tag" style={{ fontSize: '11px', marginBottom: '8px' }}>CineBook Official Entry Pass</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0 2px' }}>{activeTicket.show?.movie?.title}</h2>
                <span className="muted" style={{ fontSize: '13px' }}>{activeTicket.show?.theatre}, {activeTicket.show?.city}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13.5px', marginBottom: '16px' }}>
                <div>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>DATE & TIME</span>
                  <div style={{ fontWeight: 600 }}>
                    {activeTicket.show && new Date(activeTicket.show.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
                  <div style={{ fontWeight: 700, color: '#10b981' }}>₹{activeTicket.totalAmount}</div>
                </div>
              </div>

              {/* Mock Barcode / QR Section */}
              <div style={{ textAlign: 'center', background: '#fff', color: '#000', padding: '12px', borderRadius: '8px' }}>
                <div style={{ letterSpacing: '6px', fontWeight: 900, fontSize: '18px', fontFamily: 'monospace' }}>
                  ||| | |||| | ||| |||| |
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', letterSpacing: '1px' }}>
                  ID: {activeTicket._id?.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn outline"
                style={{ flex: 1 }}
                onClick={() => setActiveTicket(null)}
              >
                Close
              </button>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => downloadTicket(activeTicket)}
              >
                🖨️ Print Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
