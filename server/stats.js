// Estatísticas do site (coleta anônima)
import crypto from 'node:crypto';
import { q } from './db.js';

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|node-fetch|axios/i;

// Nomes amigáveis para as origens mais comuns
const SOURCES = [
  [/instagram/, 'Instagram'],
  [/facebook|fb\.(com|me)/, 'Facebook'],
  [/(^|\.)google\./, 'Google'],
  [/bing\./, 'Bing'],
  [/duckduckgo/, 'DuckDuckGo'],
  [/youtube|youtu\.be/, 'YouTube'],
  [/spotify/, 'Spotify'],
  [/(^|\.)t\.co$|twitter|x\.com/, 'X / Twitter'],
  [/tiktok/, 'TikTok'],
  [/whatsapp|wa\.me/, 'WhatsApp'],
  [/linktr\.ee/, 'Linktree'],
  [/letras\.mus/, 'Letras.mus.br'],
];

function sourceName(referrer, utm, siteHost) {
  if (utm) return String(utm).trim().slice(0, 40).toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  if (!referrer) return 'Direto';
  let host;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'Direto';
  }
  if (!host || host === siteHost) return null; // navegação interna
  return SOURCES.find(([re]) => re.test(host))?.[1] || host;
}

function deviceOf(ua) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'Celular';
  return 'Computador';
}

// Identificador anônimo: muda todo dia e não permite recuperar o IP
function visitorId(req, secret) {
  const ip = (req.get('x-forwarded-for') || req.ip || '').split(',')[0].trim();
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return crypto.createHash('sha256').update(`${secret}|${day}|${ip}|${req.get('user-agent') || ''}`).digest('hex').slice(0, 16);
}

const clip = (s, n) => (s == null ? null : String(s).slice(0, n));

export async function track(req, body, secret) {
  const ua = req.get('user-agent') || '';
  if (!ua || BOT_UA.test(ua)) return;
  const path = clip(body.path, 200);
  if (!path || !path.startsWith('/') || path.startsWith('/admin')) return;
  const visitor = visitorId(req, secret);

  if (body.type === 'view') {
    const siteHost = (req.get('host') || '').replace(/^www\./, '');
    const source = body.first ? sourceName(body.referrer, body.utm, siteHost) : null;
    const country = clip(req.get('x-vercel-ip-country'), 4);
    const region = clip(req.get('x-vercel-ip-country-region'), 8);
    await q(`INSERT INTO visits (visitor, path, source, device, country, region) VALUES ($1, $2, $3, $4, $5, $6)`, [
      visitor, path, source, deviceOf(ua), country, region,
    ]);
    if (Math.random() < 0.01) {
      await q(`DELETE FROM visits WHERE day < current_date - 400`);
      await q(`DELETE FROM clicks WHERE day < current_date - 400`);
    }
  } else if (body.type === 'click' && body.name) {
    await q(`INSERT INTO clicks (visitor, name, label, path) VALUES ($1, $2, $3, $4)`, [
      visitor, clip(body.name, 40), clip(body.label, 120), path,
    ]);
  }
}

// ---------- relatório ----------
export async function report(days) {
  const n = [7, 30, 90, 365].includes(days) ? days : 30;
  const today = `(now() AT TIME ZONE 'America/Sao_Paulo')::date`;
  const inRange = `day > ${today} - $1::int`;
  const inPrev = `day > ${today} - 2 * $1::int AND day <= ${today} - $1::int`;

  // visitantes = soma dos únicos de cada dia (o identificador anônimo muda diariamente)
  const totals = async (where) => {
    const [row] = await q(
      `SELECT coalesce(sum(c), 0)::int AS views, coalesce(sum(u), 0)::int AS visitors
       FROM (SELECT count(*) AS c, count(DISTINCT visitor) AS u FROM visits WHERE ${where} GROUP BY day) d`,
      [n],
    );
    return row;
  };

  const [cur, prev, daily, pages, sources, devices, regions, clicks, msgCur, msgPrev] = await Promise.all([
    totals(inRange),
    totals(inPrev),
    q(
      `SELECT to_char(g.day, 'YYYY-MM-DD') AS day,
              count(v.visitor)::int AS views,
              count(DISTINCT v.visitor)::int AS visitors
       FROM generate_series(${today} - ($1::int - 1), ${today}, interval '1 day') AS g(day)
       LEFT JOIN visits v ON v.day = g.day::date
       GROUP BY g.day ORDER BY g.day`,
      [n],
    ),
    q(`SELECT path AS label, count(*)::int AS value FROM visits WHERE ${inRange} GROUP BY path ORDER BY value DESC LIMIT 12`, [n]),
    q(`SELECT source AS label, count(*)::int AS value FROM visits WHERE ${inRange} AND source IS NOT NULL GROUP BY source ORDER BY value DESC LIMIT 10`, [n]),
    q(`SELECT device AS label, count(DISTINCT (day, visitor))::int AS value FROM visits WHERE ${inRange} GROUP BY device ORDER BY value DESC`, [n]),
    q(
      `SELECT coalesce(country, '??') AS country, region, count(DISTINCT (day, visitor))::int AS value
       FROM visits WHERE ${inRange} GROUP BY country, region ORDER BY value DESC LIMIT 10`,
      [n],
    ),
    q(`SELECT name, label, count(*)::int AS value FROM clicks WHERE ${inRange} GROUP BY name, label ORDER BY value DESC LIMIT 15`, [n]),
    q(`SELECT count(*)::int AS n FROM messages WHERE created_at > now() - make_interval(days => $1)`, [n]),
    q(`SELECT count(*)::int AS n FROM messages WHERE created_at > now() - make_interval(days => 2 * $1) AND created_at <= now() - make_interval(days => $1)`, [n]),
  ]);

  return {
    days: n,
    current: { ...cur, messages: msgCur[0].n },
    previous: { ...prev, messages: msgPrev[0].n },
    daily,
    pages,
    sources,
    devices,
    regions,
    clicks,
  };
}
