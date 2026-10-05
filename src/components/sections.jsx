import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { dateParts, formatDate, paragraphs, spotifyEmbed, todayIso, yearOf } from '../lib/utils.js';
import { Section } from './Section.jsx';
import { Lightbox } from './Lightbox.jsx';
import { EditButton } from '../admin/EditorPanel.jsx';

function AdminNote({ children }) {
  const { isAdmin } = useStore();
  return isAdmin ? <p className="admin-note">{children}</p> : null;
}

/* ---------------- Lançamentos ---------------- */
export function Releases({ index }) {
  const { content } = useStore();
  const releases = content.releases;
  const [currentId, setCurrentId] = useState(null);
  const current = releases.find((r) => r.id === currentId) || releases[0];

  const lyricByTitle = useMemo(() => {
    const map = new Map();
    content.lyrics.forEach((l) => l.body && map.set(l.title.trim().toLowerCase(), l));
    return map;
  }, [content.lyrics]);

  return (
    <Section id="lancamentos" index={index} title="Lançamentos" section="releases">
      {!current && <AdminNote>Nenhum lançamento cadastrado.</AdminNote>}
      {current && (
        <article className="release-feature">
          <div className="release-cover">
            {current.cover ? <img src={current.cover} alt={`Capa de ${current.title}`} /> : <div className="cover-empty" />}
          </div>
          <div className="release-info">
            <p className="mono release-meta">
              {current.type} · {formatDate(current.date) || yearOf(current.date)}
            </p>
            <h3 className="release-title">{current.title}</h3>
            {current.description && <p className="release-desc">{current.description}</p>}
            {current.tracks && (
              <ol className="tracklist">
                {current.tracks
                  .split('\n')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, i) => {
                    const lyric = lyricByTitle.get(t.toLowerCase());
                    return (
                      <li key={i}>
                        <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                        {lyric ? (
                          <Link to={`/letras/${lyric.id}`} title="Ver letra">
                            {t} <span className="track-lyric mono">letra</span>
                          </Link>
                        ) : (
                          <span>{t}</span>
                        )}
                      </li>
                    );
                  })}
              </ol>
            )}
            <div className="release-links">
              {current.otherLinks?.filter((l) => l.url).map((l) => (
                <a key={l.id} className="btn btn-sm" href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          {spotifyEmbed(current.spotifyUrl) && (
            <iframe
              className="release-player"
              title={`Spotify: ${current.title}`}
              src={spotifyEmbed(current.spotifyUrl)}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          )}
        </article>
      )}
      {releases.length > 1 && (
        <div className="release-grid">
          {releases.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`release-card${r.id === current?.id ? ' is-active' : ''}`}
              onClick={() => setCurrentId(r.id)}
            >
              {r.cover ? <img src={r.cover} alt="" loading="lazy" /> : <div className="cover-empty" />}
              <span className="release-card-title">{r.title}</span>
              <span className="mono">
                {r.type} · {yearOf(r.date)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------------- Agenda ---------------- */
export function Events({ index }) {
  const { content } = useStore();
  const [showPast, setShowPast] = useState(false);
  const today = todayIso();
  const sorted = [...content.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const upcoming = sorted.filter((e) => !e.date || e.date >= today);
  const past = sorted.filter((e) => e.date && e.date < today).reverse();

  return (
    <Section id="agenda" index={index} title="Agenda" section="events" className="section-alt">
      {upcoming.length === 0 ? (
        <div className="empty-block">
          <p>Sem datas anunciadas agora.</p>
          <a href="#contato" className="link-arrow">Quer a banda no seu evento? Fale com a gente</a>
        </div>
      ) : (
        <ul className="events">
          {upcoming.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <div className="events-past">
          <button type="button" className="link-arrow" onClick={() => setShowPast((s) => !s)}>
            {showPast ? 'Ocultar shows anteriores' : `Shows anteriores (${past.length})`}
          </button>
          {showPast && (
            <ul className="events is-past">
              {past.map((e) => (
                <EventRow key={e.id} event={e} past />
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}

function EventRow({ event: e, past }) {
  const { day, month, year } = dateParts(e.date);
  const off = e.status === 'cancelado' || e.status === 'adiado';
  return (
    <li className={`event${off ? ' is-off' : ''}`}>
      <div className="event-date">
        <span className="event-day">{day}</span>
        <span className="mono">
          {month} {year}
        </span>
      </div>
      <div className="event-info">
        <strong>{e.venue || 'Local a confirmar'}</strong>
        <span>
          {e.city}
          {e.time && ` · ${e.time}`}
        </span>
        {e.lineup && <span className="event-lineup">com {e.lineup}</span>}
      </div>
      <div className="event-cta">
        {e.status && e.status !== 'confirmado' && <span className={`badge badge-${e.status}`}>{e.status}</span>}
        {!past && !off && e.ticketUrl && e.status !== 'esgotado' && (
          <a className="btn btn-sm btn-accent" href={e.ticketUrl} target="_blank" rel="noreferrer">
            Ingressos
          </a>
        )}
      </div>
    </li>
  );
}

/* ---------------- Biografia + integrantes ---------------- */
export function Bio({ index }) {
  const { content, isAdmin } = useStore();
  const { bio } = content;
  // integrantes sem nome ficam ocultos para visitantes
  const members = content.members.filter((m) => isAdmin || m.name?.trim());
  return (
    <Section id="banda" index={index} title={bio.heading || 'A banda'} section="bio">
      <div className="bio">
        <figure className="bio-photo">{bio.image && <img src={bio.image} alt="Capão Black" loading="lazy" />}</figure>
        <div className="bio-text">
          {bio.lead && <p className="bio-lead">{bio.lead}</p>}
          {paragraphs(bio.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {bio.facts?.length > 0 && (
            <dl className="facts">
              {bio.facts.map((f) => (
                <div key={f.id}>
                  <dt className="mono">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {members.length > 0 && (
        <>
          <div className="members-head">
            <h3 className="sub-title">Formação</h3>
            <EditButton section="members" label="Editar integrantes" />
          </div>
          <AdminNote>Integrantes sem nome não aparecem para visitantes.</AdminNote>
          <ul className="members">
            {members.map((m) => (
              <li key={m.id} className="member">
                <div className="member-photo">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} loading="lazy" />
                  ) : (
                    <img src="/img/emblem.png" alt="" className="member-placeholder" />
                  )}
                </div>
                <strong>{m.name || '(sem nome)'}</strong>
                <span className="mono">{m.role}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {members.length === 0 && isAdmin && <EditButton section="members" label="Adicionar integrantes" />}
    </Section>
  );
}

/* ---------------- Fotos da banda ---------------- */
export function BandPhotos({ index }) {
  const { content } = useStore();
  const photos = content.bandPhotos;
  const [open, setOpen] = useState(null);
  return (
    <Section id="fotos" index={index} title="Fotos" section="bandPhotos" className="section-alt">
      {photos.length === 0 && <AdminNote>Sem fotos. Use “Editar” para enviar.</AdminNote>}
      <div className={`photo-wall count-${Math.min(photos.length, 5)}`}>
        {photos.map((p, i) => (
          <button key={p.id} type="button" className="photo-tile" onClick={() => setOpen(i)}>
            <img src={p.src} alt={p.caption || 'Foto da banda'} loading="lazy" />
            {p.caption && <span className="photo-caption">{p.caption}</span>}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </Section>
  );
}

/* ---------------- Galerias de shows ---------------- */
export function Galleries({ index }) {
  const { content } = useStore();
  const galleries = [...content.galleries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return (
    <Section id="shows" index={index} title="Ao vivo" section="galleries">
      {galleries.length === 0 && <AdminNote>Nenhuma galeria de show. Use “Editar” para criar a primeira.</AdminNote>}
      <div className="galleries">
        {galleries.map((g) => (
          <Link key={g.id} to={`/galeria/${g.id}`} className="gallery-card">
            <div className="gallery-cover">
              {g.photos?.[0] ? <img src={g.photos[0].src} alt="" loading="lazy" /> : <div className="cover-empty" />}
              <span className="gallery-count mono">{g.photos?.length || 0} fotos</span>
            </div>
            <div className="gallery-meta">
              <span className="mono">{formatDate(g.date)}</span>
              <strong>{g.title || g.venue}</strong>
              <span>{[g.venue !== g.title && g.venue, g.city].filter(Boolean).join(' · ')}</span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Letras ---------------- */
export function Lyrics({ index }) {
  const { content, isAdmin } = useStore();
  const list = content.lyrics.filter((l) => isAdmin || l.body);
  const groups = list.reduce((acc, l) => {
    const k = l.release || 'Outras';
    (acc[k] ||= []).push(l);
    return acc;
  }, {});
  return (
    <Section id="letras" index={index} title="Letras" section="lyrics" className="section-alt">
      <AdminNote>Letras sem texto ficam ocultas para visitantes (marcadas como “sem letra”).</AdminNote>
      {Object.entries(groups).map(([release, items]) => (
        <div key={release} className="lyrics-group">
          <h3 className="sub-title">{release}</h3>
          <ol className="lyrics-index">
            {items
              .slice()
              .sort((a, b) => (a.track || 99) - (b.track || 99))
              .map((l) => (
                <li key={l.id} className={l.body ? '' : 'is-empty'}>
                  <Link to={`/letras/${l.id}`}>
                    <span className="mono">{l.track ? String(l.track).padStart(2, '0') : '—'}</span>
                    <span className="lyric-name">{l.title}</span>
                    {!l.body && <span className="mono lyric-flag">sem letra</span>}
                  </Link>
                </li>
              ))}
          </ol>
        </div>
      ))}
    </Section>
  );
}

/* ---------------- Merch ---------------- */
export function Merch({ index }) {
  const { content, isAdmin } = useStore();
  const m = content.merch;
  const soon = m.status === 'soon';
  return (
    <Section id="merch" index={index} title={m.heading || 'Merch'} section="merch">
      {m.status === 'hidden' && <AdminNote>Seção oculta para visitantes.</AdminNote>}
      {soon && (
        <div className="merch-soon">
          <span className="merch-stamp">{m.soonTitle || 'Em breve'}</span>
          {m.soonText && <p>{m.soonText}</p>}
        </div>
      )}
      {m.items?.length > 0 && (
        <ul className={`products${soon ? ' is-preview' : ''}`}>
          {m.items.map((p) => {
            const state = soon ? 'breve' : p.stock;
            return (
              <li key={p.id} className="product">
                <div className="product-img">
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <img src="/img/emblem.png" alt="" className="member-placeholder" />}
                  {state !== 'disponivel' && <span className={`badge badge-${state}`}>{state === 'breve' ? 'em breve' : 'esgotado'}</span>}
                </div>
                <div className="product-info">
                  <strong>{p.name}</strong>
                  {p.price && <span className="mono">{p.price}</span>}
                </div>
                {p.description && <p>{p.description}</p>}
                {state === 'disponivel' && p.buyUrl && (
                  <a className="btn btn-sm btn-accent" href={p.buyUrl} target="_blank" rel="noreferrer">
                    Comprar
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {isAdmin && !m.items?.length && <AdminNote>Nenhum produto cadastrado.</AdminNote>}
    </Section>
  );
}

/* ---------------- Contato ---------------- */
export function Contact({ index }) {
  const { content } = useStore();
  const s = content.settings;
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, ok: false, error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, ok: false, error: '' });
    try {
      await api.sendMessage(form);
      setState({ busy: false, ok: true, error: '' });
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      setState({ busy: false, ok: false, error: err.message });
    }
  };

  return (
    <Section id="contato" index={index} title="Contato" section="settings" className="section-alt">
      <div className="contact">
        <div className="contact-info">
          {s.contactText && <p className="contact-text">{s.contactText}</p>}
          {s.contactEmail && (
            <a className="contact-mail" href={`mailto:${s.contactEmail}`}>
              {s.contactEmail}
            </a>
          )}
          <ul className="socials">
            {s.socials?.filter((x) => x.url).map((x) => (
              <li key={x.id}>
                <a href={x.url} target="_blank" rel="noreferrer" className="link-arrow">
                  {x.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="f-row">
            <label className="f-field">
              <span className="f-label">Nome</span>
              <input className="f-input" required value={form.name} onChange={set('name')} />
            </label>
            <label className="f-field">
              <span className="f-label">E-mail</span>
              <input className="f-input" type="email" required value={form.email} onChange={set('email')} />
            </label>
          </div>
          <label className="f-field">
            <span className="f-label">Assunto</span>
            <select className="f-input" value={form.subject} onChange={set('subject')}>
              <option value="">Escolha</option>
              <option>Show / contratação</option>
              <option>Imprensa / entrevista</option>
              <option>Merch</option>
              <option>Outro</option>
            </select>
          </label>
          <label className="f-field">
            <span className="f-label">Mensagem</span>
            <textarea className="f-input f-area" rows={5} required value={form.message} onChange={set('message')} />
          </label>
          <input className="hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden />
          <div className="contact-actions">
            <button className="btn btn-accent" disabled={state.busy}>
              {state.busy ? 'Enviando…' : 'Enviar mensagem'}
            </button>
            {state.ok && <span className="f-ok">Mensagem enviada. A banda responde pelo seu e-mail.</span>}
            {state.error && <span className="f-error">{state.error}</span>}
          </div>
        </form>
      </div>
    </Section>
  );
}
