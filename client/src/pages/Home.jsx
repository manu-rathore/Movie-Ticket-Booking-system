import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/movies')
      .then((r) => setMovies(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const genres = ['All', ...new Set(movies.map((m) => m.genre).filter(Boolean))];
  const languages = ['All', ...new Set(movies.map((m) => m.language).filter(Boolean))];

  const filtered = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.genre && m.genre.toLowerCase().includes(search.toLowerCase()));
    const matchesGenre = selectedGenre === 'All' || m.genre === selectedGenre;
    const matchesLang = selectedLang === 'All' || m.language === selectedLang;
    return matchesSearch && matchesGenre && matchesLang;
  });

  return (
    <>
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-tag">✨ Experience Next-Gen Cinema</div>
        <h1 className="hero-title">Book Latest Blockbuster Movies Online</h1>
        <p className="hero-subtitle">
          Enjoy Dolby Atmos audio, IMAX experience, best seats, and instant hassle-free digital passes!
        </p>
      </section>

      {/* Filter and Search Section */}
      <div className="filter-bar">
        <div className="search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search movie title or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: '13px' }}>Language:</span>
            <select
              style={{ width: 'auto', margin: 0, padding: '10px 14px' }}
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
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

      {/* Movie List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Now Showing ({filtered.length})</h2>
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
          {filtered.map((m) => (
            <Link to={`/movie/${m._id}`} key={m._id} className="card movie-card">
              <div className="poster-wrapper">
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
              </div>
              <div className="card-body">
                <div>
                  <h3>{m.title}</h3>
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
                  <span className="book-btn-link">Book Tickets →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
