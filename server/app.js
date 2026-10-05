// App Express usado tanto na Vercel (api/index.js) quanto localmente (server/index.js)
import './env.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import * as db from './db.js';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ARRAY_SECTIONS = ['members', 'bandPhotos', 'galleries', 'events', 'releases', 'lyrics'];
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // limite de corpo da Vercel é 4,5 MB

const app = express();
app.disable('x-powered-by');

// garante tabelas e conteúdo inicial antes de qualquer rota
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.use(wrap(async (req, res, next) => {
  await db.ensureReady();
  next();
}));

let secretPromise;
const secret = () => (secretPromise ||= db.getJwtSecret().catch((e) => { secretPromise = null; throw e; }));

const auth = wrap(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    req.user = jwt.verify(token, await secret());
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada' });
  }
});

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const clientIp = (req) => (req.get('x-forwarded-for') || req.ip || '').split(',')[0].trim();

const rateLimit = (name, max, windowSec) =>
  wrap(async (req, res, next) => {
    if (!(await db.hit(`${name}|${clientIp(req)}`, max, windowSec))) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
    }
    next();
  });

// ---------- autenticação ----------
app.post('/api/login', express.json(), rateLimit('login', 10, 600), wrap(async (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD não configurado no servidor.' });
  const { user, password } = req.body || {};
  if (!safeEqual(user || '', ADMIN_USER) || !safeEqual(password || '', ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }
  await db.clearHits(`login|${clientIp(req)}`); // login certo zera as tentativas
  const token = jwt.sign({ user: ADMIN_USER }, await secret(), { expiresIn: '7d' });
  res.json({ token, user: ADMIN_USER });
}));

app.get('/api/me', auth, (req, res) => res.json({ user: req.user.user }));

// ---------- conteúdo ----------
app.get('/api/content', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await db.getContent());
}));

app.put('/api/content/:section', auth, express.json({ limit: '2mb' }), wrap(async (req, res) => {
  const { section } = req.params;
  if (!db.SECTIONS.includes(section)) return res.status(404).json({ error: 'Seção desconhecida' });
  const value = req.body?.value;
  const isArray = ARRAY_SECTIONS.includes(section);
  if (isArray ? !Array.isArray(value) : typeof value !== 'object' || value === null || Array.isArray(value)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }
  res.json({ value: await db.setSection(section, value) });
}));

// ---------- imagens ----------
// O navegador já reduz a imagem antes de enviar; aqui chega um arquivo por requisição (corpo binário).
app.post(
  '/api/upload',
  auth,
  express.raw({ type: 'image/*', limit: MAX_IMAGE_BYTES }),
  wrap(async (req, res) => {
    const mime = (req.get('content-type') || '').split(';')[0];
    const ext = IMAGE_TYPES[mime];
    if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) {
      return res.status(400).json({ error: 'Envie uma imagem JPG, PNG, WebP, GIF ou AVIF.' });
    }
    const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    await db.saveImage(id, mime, req.body);
    res.json({ url: `/uploads/${id}` });
  }),
);

app.get('/uploads/:id', wrap(async (req, res) => {
  const img = await db.getImage(req.params.id);
  if (!img) return res.status(404).end();
  res.set({
    'Content-Type': img.mime,
    // o nome do arquivo é único, então pode ficar em cache para sempre (navegador e CDN da Vercel)
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  });
  res.send(img.data);
}));

// ---------- mensagens do formulário de contato ----------
app.post('/api/messages', express.json(), rateLimit('msg', 5, 3600), wrap(async (req, res) => {
  const { name = '', email = '', subject = '', message = '', website = '' } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot
  const clean = (s, n) => String(s).trim().slice(0, n);
  const msg = {
    name: clean(name, 120),
    email: clean(email, 160),
    subject: clean(subject, 160),
    message: clean(message, 4000),
  };
  if (!msg.name || !/^\S+@\S+\.\S+$/.test(msg.email) || !msg.message) {
    return res.status(400).json({ error: 'Preencha nome, e-mail válido e mensagem.' });
  }
  await db.addMessage(msg);
  res.json({ ok: true });
}));

app.get('/api/messages', auth, wrap(async (req, res) => res.json(await db.listMessages())));

app.patch('/api/messages/:id', auth, express.json(), wrap(async (req, res) => {
  const msg = await db.markMessage(req.params.id, Boolean(req.body?.read));
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada' });
  res.json(msg);
}));

app.delete('/api/messages/:id', auth, wrap(async (req, res) => {
  await db.deleteMessage(req.params.id);
  res.json({ ok: true });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo grande demais (máx. 4 MB).' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

export default app;
