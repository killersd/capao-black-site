// Conteúdo inicial do site. Usado só quando server/data/db.json ainda não existe.
// Tudo aqui pode ser alterado pela área administrativa.

const id = () => Math.random().toString(36).slice(2, 10);

const ALBUM_URL = 'https://open.spotify.com/album/1hc4P6vodh7suVMDqvOwvn';
const ARTIST_URL = 'https://open.spotify.com/artist/26PeNvrYEoKNkxr18RgvHr';

const tracks = [
  'Culto ao caos',
  'Ordem e prrogresso',
  'Fascista Cristão',
  'Vozes da Revolta',
  'Ditadura Virtual',
  'Guerra Santa',
  'Calamidade',
  'B.O.',
  'Fábrica de transtornos',
  'Religiões de Mentira',
  'Hipocrisia',
  'Bom Moço',
  'Parado na roda',
  'Resistir, protestar, se opor',
];

export function buildSeed() {
  const releaseId = id();
  return {
    settings: {
      bandName: 'Capão Black',
      heroKicker: 'Álbum novo · Vozes da revolta · 2025',
      heroText:
        'Catorze faixas sobre fé usada como arma, farda, tela que vigia e gente que lucra com o medo.',
      heroImage: '/img/banda-2400.jpg',
      ctaLabel: 'Ouvir o álbum',
      ctaUrl: ALBUM_URL,
      contactEmail: '',
      contactText: 'Shows, entrevistas, imprensa e parcerias: escreva direto para a banda.',
      socials: [
        { id: id(), label: 'Spotify', url: ARTIST_URL },
        { id: id(), label: 'Instagram', url: '' },
        { id: id(), label: 'YouTube', url: '' },
      ],
      footerText: 'Capão Black',
    },
    bio: {
      heading: 'A banda',
      lead: 'Capão Black escreve sobre o que está na rua e no noticiário — e toca isso alto.',
      body:
        'Edite este texto na área administrativa com a história da banda: de onde vocês vêm, quando começaram, quem passou pela formação, os palcos que marcaram e o que vem pela frente.\n\nEm agosto de 2025 a banda lançou Vozes da revolta, primeiro álbum, com 14 faixas.',
      image: '/img/banda-1400.jpg',
      facts: [
        { id: id(), label: 'Formação', value: '4 integrantes' },
        { id: id(), label: 'Último lançamento', value: 'Vozes da revolta (2025)' },
      ],
    },
    members: [
      { id: id(), name: '', role: 'Vocal', photo: '' },
      { id: id(), name: '', role: 'Guitarra', photo: '' },
      { id: id(), name: '', role: 'Baixo', photo: '' },
      { id: id(), name: '', role: 'Bateria', photo: '' },
    ],
    bandPhotos: [{ id: id(), src: '/img/banda-2400.jpg', caption: 'Capão Black' }],
    galleries: [],
    events: [],
    releases: [
      {
        id: releaseId,
        title: 'Vozes da revolta',
        type: 'Álbum',
        date: '2025-08-15',
        cover: '/img/vozes-da-revolta.jpg',
        description: 'Primeiro álbum. 14 faixas.',
        tracks: tracks.join('\n'),
        spotifyUrl: ALBUM_URL,
        otherLinks: [],
      },
    ],
    lyrics: tracks.map((title, i) => ({
      id: id(),
      title,
      release: 'Vozes da revolta',
      track: i + 1,
      body: '',
      credits: '',
    })),
    merch: {
      status: 'soon',
      heading: 'Merch',
      soonTitle: 'Em breve',
      soonText: 'O material oficial da banda está em produção. Quando abrir, os itens aparecem aqui.',
      items: [],
    },
    messages: [],
  };
}
