import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useStore } from '../lib/store.jsx';
import { formatDate } from '../lib/utils.js';

// Cores validadas para o fundo escuro do painel (dataviz validate_palette: todas as checagens ok)
const C_VIEWS = '#f2551c';
const C_VISITORS = '#3a92d0';

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
  { days: 365, label: '12 meses' },
];

const CLICK_NAMES = {
  botao_principal: 'Botão principal (topo)',
  link_lancamento: 'Link de lançamento',
  ingresso: 'Ingressos',
  comprar_merch: 'Comprar merch',
  rede_social: 'Rede social',
  email: 'E-mail',
  link_externo: 'Link externo',
  mensagem_enviada: 'Mensagem enviada',
};

const nf = new Intl.NumberFormat('pt-BR');
const fmt = (n) => nf.format(n ?? 0);
const compact = (n) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0);

let regionNames;
try {
  regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
} catch {
  regionNames = null;
}
const countryName = (code) => (code && code !== '??' ? regionNames?.of(code) || code : 'Desconhecido');

/* ---------------- peças ---------------- */

function Delta({ cur, prev, label }) {
  if (!prev && !cur) return <span className="st-delta">sem dados no período anterior</span>;
  if (!prev) return <span className="st-delta is-up">novo vs {label}</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const cls = pct > 0 ? 'is-up' : pct < 0 ? 'is-down' : '';
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '■';
  return (
    <span className={`st-delta ${cls}`}>
      <span aria-hidden>{arrow}</span> {pct > 0 ? '+' : ''}
      {pct}% vs {label}
    </span>
  );
}

function Tile({ label, value, children, hero }) {
  return (
    <div className={`st-tile${hero ? ' is-hero' : ''}`}>
      <span className="st-tile-label">{label}</span>
      <span className="st-tile-value">{value}</span>
      {children}
    </div>
  );
}

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceMax(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// Linhas no mesmo eixo, crosshair que encaixa no dia mais próximo, tooltip com todas as séries
function LineChart({ dates, series, height = 240, ariaLabel }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 44, r: 16, t: 12, b: 28 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const min = 0;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = dates.length;
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(min + (max - min) * f));
  const labelIdx = n <= 1 ? [0] : [0, Math.round((n - 1) / 2), n - 1];

  const path = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = (vals) => `${path(vals)}L${x(n - 1)},${y(min)}L${x(0)},${y(min)}Z`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((px - pad.l) / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div className="st-chart" ref={ref}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
          if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? n) - 1));
        }}
        onBlur={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="st-grid" />
            <text x={pad.l - 8} y={y(t)} className="st-axis" textAnchor="end" dominantBaseline="middle">
              {compact(t)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={height - 8} className="st-axis" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
            {formatDate(dates[i], { withYear: false })}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.key}>
            {s.area && <path d={area(s.values)} fill={s.color} opacity="0.1" />}
            <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r="4" fill={s.color} stroke="var(--bg-2)" strokeWidth="2" />
          </g>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="st-cross" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} stroke="var(--bg-2)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="st-tip"
          style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: pad.t }}
          role="status"
        >
          <span className="st-tip-date">{formatDate(dates[hover])}</span>
          {series.map((s) => (
            <span key={s.key} className="st-tip-row">
              <i style={{ background: s.color }} aria-hidden />
              <strong>{fmt(s.values[hover])}</strong> {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ series }) {
  return (
    <div className="st-legend">
      {series.map((s) => (
        <span key={s.key}>
          <i style={{ background: s.color }} aria-hidden />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// Ranking em barras horizontais (uma cor: magnitude), valor na ponta
function BarList({ rows, empty = 'Sem dados no período.' }) {
  if (!rows.length) return <p className="f-empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="st-bars">
      {rows.map((r, i) => (
        <li key={i} title={`${r.label}: ${fmt(r.value)}`}>
          <span className="st-bar-label">{r.label}</span>
          <span className="st-bar-track">
            <span className="st-bar" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </span>
          <span className="st-bar-value">{fmt(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}

function Card({ title, sub, children, wide }) {
  return (
    <section className={`st-card${wide ? ' is-wide' : ''}`}>
      <header>
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
      </header>
      {children}
    </section>
  );
}

/* ---------------- painel ---------------- */

export default function Stats() {
  const { content } = useStore();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .stats(days)
      .then((d) => alive && (setData(d), setError('')))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  // nomes legíveis para as páginas
  const pageName = useMemo(() => {
    const lyrics = new Map(content.lyrics.map((l) => [l.id, l.title]));
    const galleries = new Map(content.galleries.map((g) => [g.id, g.title || g.venue]));
    return (p) => {
      if (p === '/') return 'Página inicial';
      let m = /^\/letras\/(.+)$/.exec(p);
      if (m) return `Letra · ${lyrics.get(m[1]) || 'removida'}`;
      m = /^\/galeria\/(.+)$/.exec(p);
      if (m) return `Galeria · ${galleries.get(m[1]) || 'removida'}`;
      return p;
    };
  }, [content]);

  if (error && !data) return <p className="f-error">{error}</p>;
  if (!data) return <p className="mono">Carregando estatísticas…</p>;

  const period = PERIODS.find((p) => p.days === data.days)?.label;
  const prevLabel = `${period} anteriores`;
  const { current: cur, previous: prev } = data;
  const dates = data.daily.map((d) => d.day);
  const series = [
    { key: 'views', label: 'Visualizações', color: C_VIEWS, values: data.daily.map((d) => d.views), area: true },
    { key: 'visitors', label: 'Visitantes', color: C_VISITORS, values: data.daily.map((d) => d.visitors) },
  ];
  const totalDevices = data.devices.reduce((a, d) => a + d.value, 0) || 1;

  return (
    <div className={`stats${loading ? ' is-loading' : ''}`}>
      <div className="st-filters" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <button key={p.days} type="button" className={p.days === days ? 'is-active' : ''} onClick={() => setDays(p.days)}>
            {p.label}
          </button>
        ))}
        {error && <span className="f-error">{error}</span>}
      </div>

      <div className="st-tiles">
        <Tile label="Visualizações de página" value={fmt(cur.views)} hero>
          <Delta cur={cur.views} prev={prev.views} label={prevLabel} />
        </Tile>
        <Tile label="Visitantes" value={fmt(cur.visitors)}>
          <Delta cur={cur.visitors} prev={prev.visitors} label={prevLabel} />
        </Tile>
        <Tile label="Páginas por visitante" value={cur.visitors ? (cur.views / cur.visitors).toFixed(1).replace('.', ',') : '—'} />
        <Tile label="Mensagens recebidas" value={fmt(cur.messages)}>
          <Delta cur={cur.messages} prev={prev.messages} label={prevLabel} />
        </Tile>
      </div>

      <div className="st-grid-cards">
        <Card title="Visitas por dia" sub="Visitantes são contados uma vez por dia, de forma anônima." wide>
          <Legend series={series} />
          <LineChart dates={dates} series={series} ariaLabel={`Visualizações e visitantes por dia, últimos ${period}`} />
          <details className="st-table">
            <summary>Ver em tabela</summary>
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Visualizações</th>
                  <th>Visitantes</th>
                </tr>
              </thead>
              <tbody>
                {data.daily
                  .slice()
                  .reverse()
                  .map((d) => (
                    <tr key={d.day}>
                      <td>{formatDate(d.day)}</td>
                      <td>{fmt(d.views)}</td>
                      <td>{fmt(d.visitors)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </details>
        </Card>

        <Card title="Páginas mais vistas">
          <BarList rows={data.pages.map((p) => ({ label: pageName(p.label), value: p.value }))} />
        </Card>

        <Card title="De onde vêm os visitantes" sub="Links com ?utm_source=nome aparecem com esse nome.">
          <BarList rows={data.sources} />
        </Card>

        <Card title="Cliques">
          <BarList
            rows={data.clicks.map((c) => ({
              label: `${CLICK_NAMES[c.name] || c.name}${c.label ? ` · ${c.label}` : ''}`,
              value: c.value,
            }))}
            empty="Nenhum clique registrado no período."
          />
        </Card>

        <Card title="Localização" sub="Aproximada, a partir da rede do visitante.">
          <BarList
            rows={data.regions.map((r) => ({
              label: r.region && r.country === 'BR' ? `${r.region} · Brasil` : countryName(r.country),
              value: r.value,
            }))}
            empty="Sem dados de localização (aparecem só no site publicado)."
          />
        </Card>

        <Card title="Dispositivos">
          <BarList
            rows={data.devices.map((d) => ({
              label: `${d.label} · ${Math.round((d.value / totalDevices) * 100)}%`,
              value: d.value,
            }))}
          />
        </Card>

      </div>
    </div>
  );
}
