import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';

export function Footer() {
  const { content, isAdmin } = useStore();
  const s = content.settings;
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <img src="/img/logo.png" alt={s.bandName} className="footer-logo" />
        <ul className="footer-socials">
          {s.socials
            ?.filter((x) => x.url)
            .map((x) => (
              <li key={x.id}>
                <a href={x.url} target="_blank" rel="noreferrer" data-track="rede_social" data-label={x.label}>
                  {x.label}
                </a>
              </li>
            ))}
        </ul>
        <p className="mono footer-meta">
          © {new Date().getFullYear()} {s.footerText}
          {!isAdmin && (
            <>
              {' · '}
              <Link to="/admin">área da banda</Link>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
