export const uid = () => Math.random().toString(36).slice(2, 10);

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(iso, { withYear = true } = {}) {
  const d = parseDate(iso);
  if (!d) return '';
  const s = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
  return withYear ? `${s} ${d.getFullYear()}` : s;
}

export function dateParts(iso) {
  const d = parseDate(iso);
  if (!d) return { day: '--', month: '', year: '' };
  return { day: String(d.getDate()).padStart(2, '0'), month: MONTHS[d.getMonth()], year: d.getFullYear() };
}

export function yearOf(iso) {
  return parseDate(iso)?.getFullYear() ?? '';
}

// Converte um link do Spotify em URL de embed (álbum, faixa, artista ou playlist)
export function spotifyEmbed(url) {
  const m = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(album|track|artist|playlist)\/([A-Za-z0-9]+)/.exec(url || '');
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null;
}

export function youtubeEmbed(url) {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(url || '');
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const paragraphs = (text) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
