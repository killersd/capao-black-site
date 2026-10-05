import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from '../components/Hero.jsx';
import { useStore } from '../lib/store.jsx';
import { visibleSections } from '../lib/sections.js';

export default function Home() {
  const { content, isAdmin } = useStore();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView();
  }, [hash]);

  return (
    <>
      <Hero />
      {visibleSections(content, isAdmin).map(({ id, Component }, i) => (
        <Component key={id} index={i + 1} />
      ))}
    </>
  );
}
