// Acesso ao Neon Postgres (driver HTTP, funciona em serverless e localmente)
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { buildSeed } from './seed.js';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('DATABASE_URL não definido. Configure a conexão do Neon no .env ou na Vercel.');

export const sql = neon(url);
export const q = (text, params = []) => sql.query(text, params);

export const SECTIONS = ['settings', 'bio', 'members', 'bandPhotos', 'galleries', 'events', 'releases', 'lyrics', 'merch'];

// Cria as tabelas e o conteúdo inicial na primeira execução (uma vez por instância)
let ready;
export function ensureReady() {
  ready ||= (async () => {
    await q(`CREATE TABLE IF NOT EXISTS content (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS messages (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      subject text NOT NULL DEFAULT '',
      message text NOT NULL,
      read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS images (
      id text PRIMARY KEY,
      mime text NOT NULL,
      data bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS attempts (
      key text NOT NULL,
      at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE INDEX IF NOT EXISTS attempts_key_at ON attempts (key, at)`);
    // estatísticas: sem IP e sem cookies; "visitor" é um hash que muda todo dia
    await q(`CREATE TABLE IF NOT EXISTS visits (
      day date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
      visitor text NOT NULL,
      path text NOT NULL,
      source text,
      device text,
      country text,
      region text,
      at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE INDEX IF NOT EXISTS visits_day ON visits (day)`);
    await q(`CREATE TABLE IF NOT EXISTS clicks (
      day date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
      visitor text NOT NULL,
      name text NOT NULL,
      label text,
      path text,
      at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE INDEX IF NOT EXISTS clicks_day ON clicks (day)`);

    const seed = buildSeed();
    for (const key of SECTIONS) {
      await q(`INSERT INTO content (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING`, [
        key,
        JSON.stringify(seed[key]),
      ]);
    }
  })().catch((err) => {
    ready = null; // tenta de novo na próxima requisição
    throw err;
  });
  return ready;
}

// ---------- conteúdo ----------
export async function getContent() {
  const rows = await q(`SELECT key, value FROM content WHERE key = ANY($1)`, [SECTIONS]);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSection(key, value) {
  await q(
    `INSERT INTO content (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
  return value;
}

// Segredo do JWT: do ambiente ou gerado uma vez e guardado no banco
export async function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const fresh = crypto.randomBytes(48).toString('hex');
  await q(`INSERT INTO content (key, value) VALUES ('_jwt_secret', $1::jsonb) ON CONFLICT (key) DO NOTHING`, [
    JSON.stringify(fresh),
  ]);
  const [row] = await q(`SELECT value FROM content WHERE key = '_jwt_secret'`);
  return row.value;
}

// ---------- mensagens ----------
export async function addMessage(m) {
  await q(`INSERT INTO messages (id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)`, [
    crypto.randomUUID(),
    m.name,
    m.email,
    m.subject,
    m.message,
  ]);
}

const MSG_COLS = `id, name, email, subject, message, read, created_at AS "createdAt"`;

export const listMessages = () => q(`SELECT ${MSG_COLS} FROM messages ORDER BY created_at DESC`);

export async function markMessage(id, read) {
  const [row] = await q(`UPDATE messages SET read = $2 WHERE id = $1 RETURNING ${MSG_COLS}`, [id, read]);
  return row;
}

export const deleteMessage = (id) => q(`DELETE FROM messages WHERE id = $1`, [id]);

// ---------- imagens (guardadas em base64 -> bytea) ----------
export async function saveImage(id, mime, buffer) {
  await q(
    `INSERT INTO images (id, mime, data) VALUES ($1, $2, decode($3, 'base64'))
     ON CONFLICT (id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data`,
    [id, mime, buffer.toString('base64')],
  );
}

export async function getImage(id) {
  const [row] = await q(`SELECT mime, encode(data, 'base64') AS b64 FROM images WHERE id = $1`, [id]);
  return row ? { mime: row.mime, data: Buffer.from(row.b64, 'base64') } : null;
}

// ---------- limite de tentativas (persistente entre instâncias) ----------
export async function hit(key, max, windowSec) {
  const [{ n }] = await q(
    `SELECT count(*)::int AS n FROM attempts WHERE key = $1 AND at > now() - make_interval(secs => $2)`,
    [key, windowSec],
  );
  if (n >= max) return false;
  await q(`INSERT INTO attempts (key) VALUES ($1)`, [key]);
  if (Math.random() < 0.05) await q(`DELETE FROM attempts WHERE at < now() - interval '1 day'`);
  return true;
}

export const clearHits = (key) => q(`DELETE FROM attempts WHERE key = $1`, [key]);
