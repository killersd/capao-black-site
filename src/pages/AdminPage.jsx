import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { EDITORS } from '../admin/editors.jsx';
import { SectionForm } from '../admin/EditorPanel.jsx';

function Login() {
  const { login } = useStore();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="page admin-login">
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await login(user, password);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <img src="/img/emblem.png" alt="" className="login-emblem" />
        <h1>Área da banda</h1>
        <label className="f-field">
          <span className="f-label">Usuário</span>
          <input className="f-input" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} required />
        </label>
        <label className="f-field">
          <span className="f-label">Senha</span>
          <input
            className="f-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <span className="f-error">{error}</span>}
        <button className="btn btn-accent" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}

function Messages({ onCount }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.messages().then(setList).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (list) onCount(list.filter((m) => !m.read).length);
  }, [list, onCount]);

  if (error) return <p className="f-error">{error}</p>;
  if (!list) return <p className="mono">Carregando…</p>;
  if (!list.length) return <p className="f-empty">Nenhuma mensagem recebida.</p>;

  const mark = async (m) => {
    const upd = await api.markMessage(m.id, !m.read);
    setList((l) => l.map((x) => (x.id === m.id ? upd : x)));
  };
  const remove = async (m) => {
    if (!confirm('Excluir esta mensagem?')) return;
    await api.deleteMessage(m.id);
    setList((l) => l.filter((x) => x.id !== m.id));
  };

  return (
    <ul className="messages">
      {list.map((m) => (
        <li key={m.id} className={`message${m.read ? '' : ' is-unread'}`}>
          <div className="message-head">
            <strong>{m.name}</strong>
            <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Contato'}`)}`}>{m.email}</a>
            <span className="mono">{new Date(m.createdAt).toLocaleString('pt-BR')}</span>
          </div>
          {m.subject && <p className="mono message-subject">{m.subject}</p>}
          <p className="message-body">{m.message}</p>
          <div className="message-tools">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => mark(m)}>
              {m.read ? 'Marcar como não lida' : 'Marcar como lida'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost is-danger" onClick={() => remove(m)}>
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const TABS = [
  { key: 'overview', title: 'Visão geral' },
  { key: 'messages', title: 'Mensagens' },
  ...Object.entries(EDITORS).map(([key, { title }]) => ({ key, title })),
];

function Dashboard() {
  const { content, logout } = useStore();
  const [tab, setTab] = useState('overview');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api
      .messages()
      .then((l) => setUnread(l.filter((m) => !m.read).length))
      .catch(() => {});
  }, []);

  const stats = [
    ['releases', 'Lançamentos', content.releases.length],
    ['lyrics', 'Letras publicadas', `${content.lyrics.filter((l) => l.body).length}/${content.lyrics.length}`],
    ['events', 'Shows na agenda', content.events.length],
    ['galleries', 'Galerias de shows', content.galleries.length],
    ['bandPhotos', 'Fotos da banda', content.bandPhotos.length],
    ['merch', 'Produtos', content.merch.items.length],
  ];

  return (
    <section className="page admin">
      <div className="wrap admin-layout">
        <aside className="admin-side">
          <p className="eyebrow">Painel</p>
          <nav>
            {TABS.map((t) => (
              <button key={t.key} type="button" className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>
                {t.title}
                {t.key === 'messages' && unread > 0 && <span className="pill">{unread}</span>}
              </button>
            ))}
          </nav>
          <div className="admin-side-foot">
            <Link to="/" className="btn btn-sm">
              Ver site (modo edição)
            </Link>
            <button type="button" className="btn btn-sm btn-ghost" onClick={logout}>
              Sair
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <h1 className="admin-title">{TABS.find((t) => t.key === tab).title}</h1>
          {tab === 'overview' && (
            <>
              <p className="admin-intro">
                Tudo no site pode ser editado aqui ou direto nas páginas: com o login ativo, cada seção mostra um botão “Editar”.
              </p>
              <div className="stats">
                <button type="button" className="stat" onClick={() => setTab('messages')}>
                  <span className="stat-num">{unread}</span>
                  <span className="mono">Mensagens não lidas</span>
                </button>
                {stats.map(([key, label, n]) => (
                  <button key={key} type="button" className="stat" onClick={() => setTab(key)}>
                    <span className="stat-num">{n}</span>
                    <span className="mono">{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {tab === 'messages' && <Messages onCount={setUnread} />}
          {EDITORS[tab] && <SectionForm key={tab} section={tab} />}
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const { isAdmin } = useStore();
  return isAdmin ? <Dashboard /> : <Login />;
}
