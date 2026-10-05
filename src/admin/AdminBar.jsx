import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';

export function AdminBar() {
  const { isAdmin, logout, openEditor } = useStore();
  const { pathname } = useLocation();
  if (!isAdmin || pathname === '/admin') return null;
  return (
    <div className="admin-bar">
      <span className="admin-bar-dot" aria-hidden />
      <span className="admin-bar-label">Modo edição</span>
      <button type="button" onClick={() => openEditor('settings')}>Configurações</button>
      <Link to="/admin">Painel</Link>
      <button type="button" onClick={logout}>Sair</button>
    </div>
  );
}
