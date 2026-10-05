import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Header({ links }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`site-header${scrolled || pathname !== '/' ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap header-inner">
        <Link to="/" className="brand" aria-label="Capão Black — início">
          <img src="/img/emblem.png" alt="" className="brand-emblem" />
          <img src="/img/logo.png" alt="Capão Black" className="brand-logo" />
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
        <nav className="nav" aria-label="Seções">
          {links.map((l) => (
            <a key={l.id} href={`/#${l.id}`} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
