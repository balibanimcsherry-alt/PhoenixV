import { useState, useEffect, useCallback } from 'react';

const COUNT = 55;
const PHOTOS = Array.from({ length: COUNT }, (_, i) => `/images/gallery/photo_${String(i + 1).padStart(2, '0')}.jpg`);

export default function PhotoGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [paused, setPaused] = useState(false);

  const close = useCallback(() => { setLightbox(null); setZoomed(false); }, []);
  const prev = useCallback(() => setLightbox(i => i !== null ? (i - 1 + COUNT) % COUNT : null), []);
  const next = useCallback(() => setLightbox(i => i !== null ? (i + 1) % COUNT : null), []);

  useEffect(() => {
    if (lightbox === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightbox, close, prev, next]);

  return (
    <>
      {/* Auto-scrolling filmstrip */}
      <div
        className={`filmstrip-wrap ${paused ? 'paused' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="filmstrip">
          {[...PHOTOS, ...PHOTOS].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading={i < 12 ? 'eager' : 'lazy'}
              onClick={() => setLightbox(i % COUNT)}
              className="filmstrip-img"
            />
          ))}
        </div>
      </div>

      {/* Photo grid */}
      <div className="photo-grid">
        {PHOTOS.map((src, i) => (
          <figure key={src} className="photo-tile" onClick={() => setLightbox(i)}>
            <img src={src} alt={`Phoenix V photo ${i + 1}`} loading="lazy" />
            <div className="photo-tile-overlay">
              <span>🔍</span>
            </div>
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="lightbox-backdrop" onClick={close}>
          <button className="lb-close" onClick={close}>✕</button>
          <button className="lb-prev" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>

          <div className="lb-img-wrap" onClick={e => e.stopPropagation()}>
            <img
              src={PHOTOS[lightbox]}
              alt={`Phoenix V photo ${lightbox + 1}`}
              className={`lb-img${zoomed ? ' zoomed' : ''}`}
              onClick={() => setZoomed(z => !z)}
              title={zoomed ? 'Click to zoom out' : 'Click to zoom in'}
            />
          </div>

          <button className="lb-next" onClick={e => { e.stopPropagation(); next(); }}>›</button>
          <div className="lb-counter">{lightbox + 1} / {COUNT}</div>
        </div>
      )}
    </>
  );
}
