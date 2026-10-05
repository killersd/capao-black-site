import { useEffect, useRef } from 'react';

export function Lightbox({ photos, index, onIndex, onClose }) {
  const touch = useRef(null);
  const photo = photos[index];
  const go = (d) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  if (!photo) return null;
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={photo.src} alt={photo.caption || ''} />
        <figcaption>
          <span className="mono">
            {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
          </span>
          {photo.caption && <span>{photo.caption}</span>}
        </figcaption>
      </figure>
      {photos.length > 1 && (
        <>
          <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Anterior">‹</button>
          <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Próxima">›</button>
        </>
      )}
      <button className="lb-close" onClick={onClose} aria-label="Fechar">✕</button>
    </div>
  );
}
