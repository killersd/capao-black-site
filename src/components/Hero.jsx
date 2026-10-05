import { useStore } from '../lib/store.jsx';
import { EditButton } from '../admin/EditorPanel.jsx';

// Desktop: foto de fundo inteira, logo e texto embaixo à esquerda (sem cobrir os rostos).
// Celular/tablet: logo em cima, foto inteira no fluxo, texto abaixo.
export function Hero() {
  const { content } = useStore();
  const s = content.settings;
  return (
    <section className="hero" id="topo">
      <div className="hero-bg" style={{ backgroundImage: `url(${s.heroImage})` }} aria-hidden />
      <div className="hero-shade" aria-hidden />
      <div className="wrap hero-inner">
        <h1 className="hero-logo">
          <img src="/img/logo.png" alt={s.bandName} />
        </h1>
        <img className="hero-photo" src={s.heroImage} alt={`Integrantes da ${s.bandName}`} />
        <div className="hero-copy">
          {s.heroKicker && <p className="hero-kicker mono">{s.heroKicker}</p>}
          {s.heroText && <p className="hero-text">{s.heroText}</p>}
          <div className="hero-cta">
            {s.ctaUrl && (
              <a className="btn btn-accent btn-lg" href={s.ctaUrl} target="_blank" rel="noreferrer">
                {s.ctaLabel || 'Ouvir'}
              </a>
            )}
            <a className="btn btn-lg" href="#agenda">
              Agenda
            </a>
            <EditButton section="settings" label="Editar topo" />
          </div>
        </div>
      </div>
      <div className="hero-cut" aria-hidden />
    </section>
  );
}
