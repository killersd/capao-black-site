import { Area, ImageField, ListEditor, PhotoGrid, Row, Select, Text } from './fields.jsx';
import { formatDate } from '../lib/utils.js';

// Cada editor recebe { value, onChange, focusId } e trabalha sobre um rascunho.

function SettingsEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <h3 className="f-group">Topo da página</h3>
      <Text label="Nome da banda" value={value.bandName} onChange={(v) => set({ bandName: v })} />
      <Text label="Linha de destaque (acima do texto)" value={value.heroKicker} onChange={(v) => set({ heroKicker: v })} />
      <Area label="Texto de abertura" rows={3} value={value.heroText} onChange={(v) => set({ heroText: v })} />
      <ImageField label="Foto de fundo" value={value.heroImage} max={2600} onChange={(v) => set({ heroImage: v })} />
      <Row>
        <Text label="Texto do botão" value={value.ctaLabel} onChange={(v) => set({ ctaLabel: v })} />
        <Text label="Link do botão" value={value.ctaUrl} onChange={(v) => set({ ctaUrl: v })} />
      </Row>
      <h3 className="f-group">Contato e redes</h3>
      <Text label="E-mail de contato" type="email" value={value.contactEmail} onChange={(v) => set({ contactEmail: v })} />
      <Area label="Texto da área de contato" rows={2} value={value.contactText} onChange={(v) => set({ contactText: v })} />
      <ListEditor
        items={value.socials}
        onChange={(socials) => set({ socials })}
        addLabel="Rede social"
        create={() => ({ label: '', url: '' })}
        summary={(s) => `${s.label || 'Rede'} ${s.url ? '' : '· sem link (oculta)'}`}
        render={(s, up) => (
          <Row>
            <Text label="Nome" value={s.label} onChange={(v) => up({ label: v })} placeholder="Instagram" />
            <Text label="Link" value={s.url} onChange={(v) => up({ url: v })} placeholder="https://" />
          </Row>
        )}
      />
      <h3 className="f-group">Rodapé</h3>
      <Text label="Texto do rodapé" value={value.footerText} onChange={(v) => set({ footerText: v })} />
    </>
  );
}

function BioEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <Text label="Título da seção" value={value.heading} onChange={(v) => set({ heading: v })} />
      <Area label="Frase de abertura" rows={2} value={value.lead} onChange={(v) => set({ lead: v })} />
      <Area
        label="Biografia"
        hint="Deixe uma linha em branco entre os parágrafos."
        rows={12}
        value={value.body}
        onChange={(v) => set({ body: v })}
      />
      <ImageField label="Foto da biografia" value={value.image} onChange={(v) => set({ image: v })} aspect="4/5" />
      <h3 className="f-group">Ficha rápida</h3>
      <ListEditor
        items={value.facts}
        onChange={(facts) => set({ facts })}
        addLabel="Informação"
        create={() => ({ label: '', value: '' })}
        summary={(f) => `${f.label}: ${f.value}`}
        render={(f, up) => (
          <Row>
            <Text label="Rótulo" value={f.label} onChange={(v) => up({ label: v })} placeholder="Origem" />
            <Text label="Valor" value={f.value} onChange={(v) => up({ value: v })} />
          </Row>
        )}
      />
    </>
  );
}

function MembersEditor({ value, onChange, focusId }) {
  return (
    <ListEditor
      items={value}
      onChange={onChange}
      openId={focusId}
      addLabel="Integrante"
      create={() => ({ name: '', role: '', photo: '' })}
      summary={(m) => `${m.name || 'Sem nome'} — ${m.role || 'função'}`}
      render={(m, up) => (
        <>
          <Row>
            <Text label="Nome" value={m.name} onChange={(v) => up({ name: v })} />
            <Text label="Função" value={m.role} onChange={(v) => up({ role: v })} placeholder="Guitarra" />
          </Row>
          <ImageField label="Foto" value={m.photo} onChange={(v) => up({ photo: v })} aspect="3/4" max={1200} />
        </>
      )}
    />
  );
}

function BandPhotosEditor({ value, onChange }) {
  return <PhotoGrid value={value} onChange={onChange} />;
}

function GalleriesEditor({ value, onChange, focusId }) {
  return (
    <ListEditor
      items={value}
      onChange={onChange}
      openId={focusId}
      addToTop
      addLabel="Galeria de show"
      create={() => ({ title: '', date: '', venue: '', city: '', credit: '', photos: [] })}
      summary={(g) => `${g.title || 'Sem título'} · ${formatDate(g.date) || 'sem data'} · ${g.photos?.length || 0} fotos`}
      render={(g, up) => (
        <>
          <Row>
            <Text label="Título" value={g.title} onChange={(v) => up({ title: v })} placeholder="Nome do evento" />
            <Text label="Data" type="date" value={g.date} onChange={(v) => up({ date: v })} />
          </Row>
          <Row>
            <Text label="Local" value={g.venue} onChange={(v) => up({ venue: v })} />
            <Text label="Cidade" value={g.city} onChange={(v) => up({ city: v })} />
          </Row>
          <Text label="Crédito das fotos" value={g.credit} onChange={(v) => up({ credit: v })} placeholder="Foto: nome do fotógrafo" />
          <PhotoGrid value={g.photos} onChange={(photos) => up({ photos })} />
        </>
      )}
    />
  );
}

function EventsEditor({ value, onChange, focusId }) {
  return (
    <ListEditor
      items={value}
      onChange={onChange}
      openId={focusId}
      addToTop
      addLabel="Show na agenda"
      create={() => ({ date: '', time: '', venue: '', city: '', lineup: '', ticketUrl: '', status: 'confirmado' })}
      summary={(e) => `${formatDate(e.date) || 'sem data'} · ${e.venue || 'local'} · ${e.city || ''}`}
      render={(e, up) => (
        <>
          <Row>
            <Text label="Data" type="date" value={e.date} onChange={(v) => up({ date: v })} />
            <Text label="Horário" value={e.time} onChange={(v) => up({ time: v })} placeholder="21h" />
            <Select
              label="Situação"
              value={e.status}
              onChange={(v) => up({ status: v })}
              options={[
                { value: 'confirmado', label: 'Confirmado' },
                { value: 'esgotado', label: 'Esgotado' },
                { value: 'cancelado', label: 'Cancelado' },
                { value: 'adiado', label: 'Adiado' },
              ]}
            />
          </Row>
          <Row>
            <Text label="Local" value={e.venue} onChange={(v) => up({ venue: v })} />
            <Text label="Cidade / UF" value={e.city} onChange={(v) => up({ city: v })} />
          </Row>
          <Text label="Outras bandas" value={e.lineup} onChange={(v) => up({ lineup: v })} />
          <Text label="Link de ingressos ou do evento" value={e.ticketUrl} onChange={(v) => up({ ticketUrl: v })} />
        </>
      )}
    />
  );
}

function ReleasesEditor({ value, onChange, focusId }) {
  return (
    <ListEditor
      items={value}
      onChange={onChange}
      openId={focusId}
      addToTop
      addLabel="Lançamento"
      create={() => ({ title: '', type: 'Single', date: '', cover: '', description: '', tracks: '', spotifyUrl: '', otherLinks: [] })}
      summary={(r) => `${r.title || 'Sem título'} · ${r.type} · ${r.date?.slice(0, 4) || ''}`}
      render={(r, up) => (
        <>
          <Row>
            <Text label="Título" value={r.title} onChange={(v) => up({ title: v })} />
            <Select label="Tipo" value={r.type} onChange={(v) => up({ type: v })} options={['Álbum', 'EP', 'Single', 'Split', 'Demo', 'Ao vivo', 'Clipe']} />
            <Text label="Data de lançamento" type="date" value={r.date} onChange={(v) => up({ date: v })} />
          </Row>
          <ImageField label="Capa" value={r.cover} onChange={(v) => up({ cover: v })} aspect="1/1" max={1400} />
          <Area label="Texto sobre o lançamento" rows={4} value={r.description} onChange={(v) => up({ description: v })} />
          <Area label="Faixas (uma por linha)" rows={8} value={r.tracks} onChange={(v) => up({ tracks: v })} mono />
          <Text
            label="Link do Spotify"
            hint="Álbum, single ou faixa. O player aparece automaticamente."
            value={r.spotifyUrl}
            onChange={(v) => up({ spotifyUrl: v })}
          />
          <ListEditor
            items={r.otherLinks || []}
            onChange={(otherLinks) => up({ otherLinks })}
            addLabel="Outro link (YouTube, Bandcamp, Deezer…)"
            create={() => ({ label: '', url: '' })}
            summary={(l) => l.label}
            render={(l, upl) => (
              <Row>
                <Text label="Nome" value={l.label} onChange={(v) => upl({ label: v })} />
                <Text label="Link" value={l.url} onChange={(v) => upl({ url: v })} />
              </Row>
            )}
          />
        </>
      )}
    />
  );
}

function LyricsEditor({ value, onChange, focusId }) {
  return (
    <ListEditor
      items={value}
      onChange={onChange}
      openId={focusId}
      addLabel="Letra"
      create={() => ({ title: '', release: '', track: '', body: '', credits: '' })}
      summary={(l) => `${l.title || 'Sem título'}${l.body ? '' : ' · sem letra'}`}
      render={(l, up) => (
        <>
          <Row>
            <Text label="Título" value={l.title} onChange={(v) => up({ title: v })} />
            <Text label="Lançamento" value={l.release} onChange={(v) => up({ release: v })} />
            <Text label="Faixa nº" type="number" value={l.track} onChange={(v) => up({ track: v })} />
          </Row>
          <Area
            label="Letra"
            hint="Estrofes separadas por uma linha em branco."
            rows={16}
            value={l.body}
            onChange={(v) => up({ body: v })}
            mono
          />
          <Text label="Créditos" value={l.credits} onChange={(v) => up({ credits: v })} placeholder="Letra e música: …" />
        </>
      )}
    />
  );
}

function MerchEditor({ value, onChange, focusId }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <Select
        label="Situação da loja"
        value={value.status}
        onChange={(v) => set({ status: v })}
        options={[
          { value: 'soon', label: 'Em breve (mostra o aviso e prévias dos itens)' },
          { value: 'open', label: 'Aberta (mostra os produtos)' },
          { value: 'hidden', label: 'Oculta (não aparece no site)' },
        ]}
      />
      <Text label="Título da seção" value={value.heading} onChange={(v) => set({ heading: v })} />
      <Row>
        <Text label="Título do aviso" value={value.soonTitle} onChange={(v) => set({ soonTitle: v })} />
      </Row>
      <Area label="Texto do aviso" rows={3} value={value.soonText} onChange={(v) => set({ soonText: v })} />
      <h3 className="f-group">Produtos</h3>
      <ListEditor
        items={value.items}
        onChange={(items) => set({ items })}
        openId={focusId}
        addLabel="Produto"
        create={() => ({ name: '', price: '', image: '', description: '', buyUrl: '', stock: 'disponivel' })}
        summary={(p) => `${p.name || 'Sem nome'} ${p.price ? '· ' + p.price : ''}`}
        render={(p, up) => (
          <>
            <Row>
              <Text label="Nome" value={p.name} onChange={(v) => up({ name: v })} />
              <Text label="Preço" value={p.price} onChange={(v) => up({ price: v })} placeholder="R$ 70" />
              <Select
                label="Estoque"
                value={p.stock}
                onChange={(v) => up({ stock: v })}
                options={[
                  { value: 'disponivel', label: 'Disponível' },
                  { value: 'esgotado', label: 'Esgotado' },
                  { value: 'breve', label: 'Em breve' },
                ]}
              />
            </Row>
            <ImageField label="Foto do produto" value={p.image} onChange={(v) => up({ image: v })} aspect="1/1" max={1400} />
            <Area label="Descrição" rows={3} value={p.description} onChange={(v) => up({ description: v })} />
            <Text label="Link de compra" value={p.buyUrl} onChange={(v) => up({ buyUrl: v })} hint="Loja externa, WhatsApp, formulário…" />
          </>
        )}
      />
    </>
  );
}

export const EDITORS = {
  settings: { title: 'Configurações gerais', Component: SettingsEditor },
  bio: { title: 'Biografia', Component: BioEditor },
  members: { title: 'Integrantes', Component: MembersEditor },
  bandPhotos: { title: 'Fotos da banda', Component: BandPhotosEditor },
  galleries: { title: 'Galerias de shows', Component: GalleriesEditor },
  events: { title: 'Agenda', Component: EventsEditor },
  releases: { title: 'Lançamentos', Component: ReleasesEditor },
  lyrics: { title: 'Letras', Component: LyricsEditor },
  merch: { title: 'Merch', Component: MerchEditor },
};
