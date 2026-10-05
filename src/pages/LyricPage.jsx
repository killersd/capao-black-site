import { Link, useParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { EditButton } from '../admin/EditorPanel.jsx';
import { paragraphs } from '../lib/utils.js';
import NotFound from './NotFound.jsx';

export default function LyricPage() {
  const { id } = useParams();
  const { content, isAdmin } = useStore();
  const visible = content.lyrics.filter((l) => isAdmin || l.body);
  const i = visible.findIndex((l) => l.id === id);
  const lyric = visible[i];
  if (!lyric) return <NotFound />;
  const prev = visible[i - 1];
  const next = visible[i + 1];

  return (
    <article className="page lyric-page">
      <div className="wrap lyric-wrap">
        <Link to="/#letras" className="back mono">← Letras</Link>
        <header className="lyric-head">
          <p className="mono">
            {lyric.release}
            {lyric.track ? ` · faixa ${String(lyric.track).padStart(2, '0')}` : ''}
          </p>
          <h1>{lyric.title}</h1>
          <EditButton section="lyrics" focusId={lyric.id} label="Editar letra" />
        </header>
        <div className="lyric-body">
          {lyric.body ? (
            paragraphs(lyric.body).map((stanza, k) => <p key={k}>{stanza}</p>)
          ) : (
            <p className="admin-note">Letra ainda não cadastrada.</p>
          )}
        </div>
        {lyric.credits && <p className="lyric-credits mono">{lyric.credits}</p>}
        <nav className="lyric-nav">
          {prev ? <Link to={`/letras/${prev.id}`}>← {prev.title}</Link> : <span />}
          {next ? <Link to={`/letras/${next.id}`}>{next.title} →</Link> : <span />}
        </nav>
      </div>
    </article>
  );
}
