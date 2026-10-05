// Estatísticas anônimas: sem cookies, sem IP guardado. Quem está logado no admin não é contado.
import { getToken } from './api.js';

let first = true;

function send(payload) {
  if (getToken()) return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.('/api/track', body)) return;
  } catch {
    /* segue para o fetch */
  }
  fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => {});
}

export function trackView(path) {
  const utm = new URLSearchParams(location.search).get('utm_source');
  send({ type: 'view', path, first, referrer: first ? document.referrer : '', utm: first ? utm : null });
  first = false;
}

export function trackClick(name, label) {
  send({ type: 'click', name, label, path: location.pathname });
}

// Cliques em links: usa data-track/data-label quando existem; senão registra links externos
export function onDocumentClick(e) {
  const a = e.target.closest?.('a[href]');
  if (!a) return;
  let url;
  try {
    url = new URL(a.href, location.href);
  } catch {
    return;
  }
  const external = url.origin !== location.origin && /^https?:/.test(url.protocol);
  const name = a.dataset.track || (url.protocol === 'mailto:' ? 'email' : external ? 'link_externo' : null);
  if (!name) return;
  trackClick(name, a.dataset.label || (external ? url.hostname.replace(/^www\./, '') : a.textContent.trim().slice(0, 80)));
}
