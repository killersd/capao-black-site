import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { EditButton } from '../admin/EditorPanel.jsx';
import { Lightbox } from '../components/Lightbox.jsx';
import { formatDate } from '../lib/utils.js';
import NotFound from './NotFound.jsx';

export default function GalleryPage() {
  const { id } = useParams();
  const { content } = useStore();
  const [open, setOpen] = useState(null);
  const g = content.galleries.find((x) => x.id === id);
  if (!g) return <NotFound />;
  const photos = g.photos || [];

  return (
    <section className="page">
      <div className="wrap">
        <Link to="/#shows" className="back mono">← Ao vivo</Link>
        <header className="gallery-head">
          <p className="mono">
            {formatDate(g.date)} {g.city && `· ${g.city}`}
          </p>
          <h1>{g.title || g.venue}</h1>
          {g.venue && g.venue !== g.title && <p className="gallery-venue">{g.venue}</p>}
          {g.credit && <p className="mono gallery-credit">{g.credit}</p>}
          <EditButton section="galleries" focusId={g.id} label="Editar galeria" />
        </header>
        <div className="gallery-grid">
          {photos.map((p, i) => (
            <button key={p.id} type="button" className="photo-tile" onClick={() => setOpen(i)}>
              <img src={p.src} alt={p.caption || g.title} loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}
