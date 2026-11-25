import { useEffect } from 'react';
import { getYouTubeEmbedUrl } from '../utils/pricing.js';

export default function TrailerModal({ movie, onClose }) {
  useEffect(() => {
    if (!movie) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movie, onClose]);

  if (!movie) return null;

  const embedUrl = getYouTubeEmbedUrl(movie.trailerUrl);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${movie.title} Trailer`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '760px', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0 }}>🎬 {movie.title} — Official Trailer</h3>
            <span className="muted" style={{ fontSize: '12.5px' }}>
              {movie.genre} • {movie.language} {movie.certificate ? `• ${movie.certificate}` : ''}
            </span>
          </div>
          <button className="btn small outline" onClick={onClose} aria-label="Close trailer">
            ✕
          </button>
        </div>

        {embedUrl ? (
          <div className="trailer-frame-wrap">
            <iframe
              src={embedUrl}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '36px', marginBottom: '10px' }}>🎞️</p>
            <h4>Trailer Preview</h4>
            <p className="muted" style={{ margin: '8px 0 16px' }}>
              {movie.trailerUrl
                ? 'External trailer link open karein:'
                : 'Is movie ka official trailer abhi upload nahi hua hai.'}
            </p>
            {movie.trailerUrl && (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn small"
              >
                Watch on External Player ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
