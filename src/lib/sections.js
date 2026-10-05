import { BandPhotos, Bio, Contact, Events, Galleries, Lyrics, Merch, Releases } from '../components/sections.jsx';

// Ordem das seções da página inicial e quando cada uma aparece para visitantes
export const HOME_SECTIONS = [
  { id: 'lancamentos', label: 'Música', Component: Releases, visible: (c) => c.releases.length > 0 },
  { id: 'agenda', label: 'Agenda', Component: Events, visible: () => true },
  { id: 'banda', label: 'Banda', Component: Bio, visible: () => true },
  { id: 'fotos', label: 'Fotos', Component: BandPhotos, visible: (c) => c.bandPhotos.length > 0 },
  { id: 'shows', label: 'Ao vivo', Component: Galleries, visible: (c) => c.galleries.length > 0 },
  { id: 'letras', label: 'Letras', Component: Lyrics, visible: (c) => c.lyrics.some((l) => l.body) },
  { id: 'merch', label: 'Merch', Component: Merch, visible: (c) => c.merch.status !== 'hidden' },
  { id: 'contato', label: 'Contato', Component: Contact, visible: () => true },
];

export function visibleSections(content, isAdmin) {
  if (!content) return [];
  return HOME_SECTIONS.filter((s) => isAdmin || s.visible(content));
}
