import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './lib/store.jsx';
import { visibleSections } from './lib/sections.js';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { AdminBar } from './admin/AdminBar.jsx';
import { EditorDrawer } from './admin/EditorPanel.jsx';
import Home from './pages/Home.jsx';
import LyricPage from './pages/LyricPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { content, error, isAdmin } = useStore();

  if (error) {
    return (
      <div className="boot">
        <p className="mono">Não foi possível carregar o conteúdo.</p>
        <p className="f-error">{error}</p>
      </div>
    );
  }
  if (!content) {
    return (
      <div className="boot" aria-busy="true">
        <img src="/img/emblem.png" alt="Carregando" className="boot-emblem" />
      </div>
    );
  }

  return (
    <>
      <ScrollTop />
      <Header links={visibleSections(content, isAdmin)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/letras/:id" element={<LyricPage />} />
          <Route path="/galeria/:id" element={<GalleryPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AdminBar />
      <EditorDrawer />
    </>
  );
}
