import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getCountdownInfo } from '../utils/pricing.js';
import TrailerModal from '../components/TrailerModal.jsx';

export default function Home() {
  const { user, updateUser, city } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [spotlightIdx, setSpotlightIdx] = useState(0);

  const loadMovies = () => {
    setLoading(true);
    api
      .get('/movies')
      .then((r) => setMovies(r.data))
      .catch(() => showToast('Movies load karne me dikkat aayi', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const nowShowingAll = movies.filter((m) => !m.status || m.status === 'now_showing');
  const upcomingMovies = movies
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));

  // Rotate hero spotlight across featured upcoming or top movies
  const spotlightPool = upcomingMovies.length > 0 ? upcomingMovies : nowShowingAll;
  useEffect(() => {
    if (spotlightPool.length <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % spotlightPool.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [spotlightPool.length]);

  const genres = ['All', ...new Set(nowShowingAll.map((m) => m.genre).filter(Boolean))];
  const languages = ['All', ...new Set(nowShowingAll.map((m) => m.language).filter(Boolean))];

  const filtered = nowShowingAll
    .filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        m.title.toLowerCase().includes(q) ||
        (m.genre && m.genre.toLowerCase().includes(q)) ||
        (m.cast && m.cast.some((c) => c.toLowerCase().includes(q)));
      const matchesGenre = selectedGenre === 'All' || m.genre === selectedGenre;
      const matchesLang = selectedLang === 'All' || m.language === selectedLang;
      return matchesSearch && matchesGenre && matchesLang;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const handleInterestToggle = async (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Reminder set karne ke liye pehle login karein', 'info');
      return navigate('/login');
    }
    try {
      const r = await api.post(`/movies/${movie._id}/interest`);
      setMovies((prev) =>
        prev.map((m) => (m._id === movie._id ? { ...m, interestedUsers: r.data.interestedUsers } : m))
      );
      showToast(
        r.data.interested
          ? `🔔 "${movie.title}" ke release par aapko notify kiya jayega!`
          : `"${movie.title}" se reminder hata diya gaya`,
        r.data.interested ? 'success' : 'info'
      );
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const handleWatchlistToggle = async (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Watchlist me save karne ke liye login karein', 'info');
      return navigate('/login');
    }
    try {
      const r = await api.post(`/auth/watchlist/${movie._id}`);
      updateUser({ ...user, watchlist: r.data.watchlist });
      showToast(
        r.data.saved ? `❤️ "${movie.title}" Watchlist me save ho gayi!` : `"${movie.title}" Watchlist se hatayi gayi`,
        r.data.saved ? 'success' : 'info'
      );
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const copyPromo = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`Promo code "${code}" copy ho gaya! Checkout par apply karein.`, 'success');
  };

  const spotlight = spotlightPool[spotlightIdx % Math.max(1, spotlightPool.length)];
  const userId = user?.id || user?._id;
  const watchlistSet = new Set((user?.watchlist || []).map(String));

  return (
    <>
      {/* Hero Spotlight Banner */}
      <section className="hero-banner hero-spotlight">
        <div className="hero-content">
          <div className="hero-tag">
            {spotlight?.status === 'upcoming' ? '🚀 Coming Soon Spotlight' : '✨ Now Playing in Theatres'}
          </div>
          <h1 className="hero-title">
            {spotlight ? spotlight.title : 'Book Latest Blockbuster Movies Online'}
          </h1>
          <p className="hero-subtitle">
            {spotlight?.description ||
              'Enjoy Dolby Atmos audio, IMAX experience, best seats, and instant hassle-free digital passes!'}
          </p>

          {spotlight && (
            <div className="hero-meta-chips">
              <span className="meta-chip">{spotlight.genre}</span>
              <span className="meta-chip">{spotlight.language}</span>
              {spotlight.formats?.length > 0 && (
                <span className="meta-chip">{spotlight.formats.join(' • ')}</span>
              )}
              {spotlight.status === 'upcoming' && (
                <span className="meta-chip countdown-chip">
                  🗓️ {getCountdownInfo(spotlight.releaseDate).label}
                </span>
              )}
            </div>
          )}

          <div className="hero-actions">
            {spotlight && (
              <>
                <Link to={`/movie/${spotlight._id}`} className="btn">
                  {spotlight.status === 'upcoming' ? 'View Details & Cast →' : 'Book Tickets Now →'}
                </Link>
                {spotlight.trailerUrl && (
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setTrailerMovie(spotlight)}
                  >
                    ▶ Watch Trailer
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {spotlight && (
          <div className="hero-poster-preview">
            <img
              src={spotlight.poster || 'https://placehold.co/300x450/1e293b/ffffff?text=CineBook'}
              alt={spotlight.title}
            />
            {spotlightPool.length > 1 && (
              <div className="spotlight-dots">
                {spotlightPool.map((item, idx) => (
                  <button
                    key={item._id}
                    type="button"
                    aria-label={`Show spotlight ${idx + 1}`}
                    className={`spotlight-dot ${idx === spotlightIdx % spotlightPool.length ? 'active' : ''}`}
                    onClick={() => setSpotlightIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Offers & Promo Strip */}
      <div className="offers-strip card">
        <div className="offers-label">🎁 Exclusive Offers:</div>
        <div className="offers-chips">
          <button type="button" className="promo-chip" onClick={() => copyPromo('FIRST100')}>
            <b>FIRST100</b> — Flat ₹100 OFF (₹350+)
          </button>
          <button type="button" className="promo-chip" onClick={() => copyPromo('CINE20')}>
            <b>CINE20</b> — 20% OFF (up to ₹150)
          </button>
          <button type="button" className="promo-chip" onClick={() => copyPromo('POPCORN50')}>
            <b>POPCORN50</b> — ₹50 OFF Combo Deals
          </button>
        </div>
      </div>

      {/* UPCOMING / COMING SOON MOVIES PANEL */}
      <section id="upcoming-panel" className="upcoming-panel">
        <div className="section-header-row">
          <div>
            <div className="section-kicker">🔥 RELEASING SOON IN CINEMAS</div>
            <h2 style={{ margin: '4px 0 0' }}>🚀 Upcoming Movies Panel ({upcomingMovies.length})</h2>
          </div>
          <span className="muted" style={{ fontSize: '13.5px' }}>
            Trailers dekhein & "Notify Me" dabakar release alerts paayein
          </span>
        </div>

        {loading ? (
          <p className="muted" style={{ padding: '20px 0' }}>Loading upcoming releases...</p>
        ) : upcomingMovies.length === 0 ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <p className="muted">
              Abhi koi upcoming movie scheduled nahi hai. Admin panel se nayi upcoming movies add kar sakte hain!
            </p>
          </div>
        ) : (
          <div className="upcoming-scroll">
            {upcomingMovies.map((m) => {
              const countdown = getCountdownInfo(m.releaseDate);
              const interestedList = m.interestedUsers || [];
              const isInterested = userId && interestedList.some((u) => String(u) === String(userId));
              const isSaved = watchlistSet.has(String(m._id));

              return (
                <div key={m._id} className="card upcoming-card">
                  <Link to={`/movie/${m._id}`} className="upcoming-poster-wrap">
                    <img
                      src={m.poster || 'https://placehold.co/300x450/1e293b/ffffff?text=Coming+Soon'}
                      alt={m.title}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/300x450/1e293b/ffffff?text=Coming+Soon';
                      }}
                    />
                    <span className="upcoming-badge">COMING SOON</span>
                    <span className="countdown-pill">{countdown.label}</span>
                    <button
                      type="button"
                      className={`heart-btn ${isSaved ? 'saved' : ''}`}
                      onClick={(e) => handleWatchlistToggle(e, m)}
                      title={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
                      aria-label="Toggle watchlist"
                    >
                      {isSaved ? '❤️' : '🤍'}
                    </button>
                  </Link>

                  <div className="upcoming-body">
                    <Link to={`/movie/${m._id}`}>
                      <h3>{m.title}</h3>
                    </Link>
                    <p className="dim" style={{ marginBottom: '6px' }}>
                      {m.genre} • {m.language} {m.certificate ? `• ${m.certificate}` : ''}
                    </p>
                    <p className="muted upcoming-desc">{m.description}</p>

                    <div className="upcoming-stats">
                      <span className="interest-count">
                        👍 {interestedList.length + 120} interested
                      </span>
                      {m.formats?.length > 0 && (
                        <span className="format-mini">{m.formats.slice(0, 2).join(' / ')}</span>
                      )}
                    </div>

                    <div className="upcoming-actions">
                      <button
                        type="button"
                        className={`btn small ${isInterested ? 'notify-active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={(e) => handleInterestToggle(e, m)}
                      >
                        {isInterested ? '🔔 Notified ✓' : '🔔 Notify Me'}
                      </button>
                      <button
                        type="button"
                        className="btn small outline"
                        onClick={() => setTrailerMovie(m)}
                        title="Watch Official Trailer"
                      >
                        ▶ Trailer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Filter and Search Section for Now Showing */}
      <div className="filter-bar" style={{ marginTop: '36px' }}>
        <div className="search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search movie title, genre, or actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              aria-label="Filter by Language"
              style={{ width: 'auto', margin: 0, padding: '10px 14px' }}
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l === 'All' ? '🌐 All Languages' : l}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort Movies"
              style={{ width: 'auto', margin: 0, padding: '10px 14px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">✨ Sort: Latest</option>
              <option value="rating">⭐ Sort: Top Rated</option>
              <option value="title">🔤 Sort: A–Z</option>
            </select>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="genre-pills">
          {genres.map((g) => (
            <button
              key={g}
              className={`genre-pill ${selectedGenre === g ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g === 'All' ? '🍿 All Genres' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Now Showing Header */}
      <div className="section-header-row" style={{ marginBottom: '18px' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            Now Showing ({filtered.length}) {city !== 'All' ? `in ${city}` : ''}
          </h2>
        </div>
        {filtered.length > 0 && <span className="dim">Select a movie to pick seats & showtimes</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p>🎬 Loading movies...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', margin: '20px 0' }}>
          <h3>Koi movie nahi mili 😕</h3>
          <p className="muted" style={{ marginTop: '8px' }}>
            Kripya filter reset karein ya search query change karein.
          </p>
          {(search || selectedGenre !== 'All' || selectedLang !== 'All') && (
            <button
              className="btn small outline"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSearch('');
                setSelectedGenre('All');
                setSelectedLang('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {filtered.map((m) => {
            const isSaved = watchlistSet.has(String(m._id));
            return (
              <div key={m._id} className="card movie-card">
                <Link to={`/movie/${m._id}`} className="poster-wrapper">
                  <img
                    src={m.poster || 'https://placehold.co/300x450/1e293b/ffffff?text=CineBook'}
                    alt={m.title}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/300x450/1e293b/ffffff?text=CineBook';
                    }}
                  />
                  <span className="rating-badge">
                    ⭐ {m.rating ? Number(m.rating).toFixed(1) : '8.0'}
                  </span>
                  {m.certificate && <span className="cert-badge">{m.certificate}</span>}
                  <button
                    type="button"
                    className={`heart-btn ${isSaved ? 'saved' : ''}`}
                    onClick={(e) => handleWatchlistToggle(e, m)}
                    title={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
                    aria-label="Toggle watchlist"
                  >
                    {isSaved ? '❤️' : '🤍'}
                  </button>
                </Link>
                <div className="card-body">
                  <div>
                    <Link to={`/movie/${m._id}`}>
                      <h3>{m.title}</h3>
                    </Link>
                    <div className="card-tags">
                      <span>{m.genre || 'Action'}</span>
                      <span>•</span>
                      <span>{m.language || 'Hindi'}</span>
                      {m.duration && (
                        <>
                          <span>•</span>
                          <span>{m.duration}m</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-footer">
                    <Link to={`/movie/${m._id}`} className="book-btn-link">
                      Book Tickets →
                    </Link>
                    {m.trailerUrl && (
                      <button
                        type="button"
                        className="trailer-mini-btn"
                        onClick={() => setTrailerMovie(m)}
                      >
                        ▶ Trailer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
    </>
  );
}
