// Copia o conteúdo da versão antiga (server/data/db.json + server/uploads/) para o Neon.
// Uso: npm run db:import   (precisa de DATABASE_URL no .env)
// As URLs das imagens continuam as mesmas (/uploads/<arquivo>), então nada no conteúdo precisa mudar.
import '../server/env.js';
import fs from 'node:fs';
import path from 'node:path';
import { ensureReady, setSection, saveImage, sql, SECTIONS } from '../server/db.js';

const DB_FILE = 'server/data/db.json';
const UPLOAD_DIR = 'server/uploads';
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

await ensureReady();

if (fs.existsSync(DB_FILE)) {
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  for (const key of SECTIONS) {
    if (key in data) {
      await setSection(key, data[key]);
      console.log(`conteúdo: ${key}`);
    }
  }
  for (const m of data.messages || []) {
    await sql.query(
      `INSERT INTO messages (id, name, email, subject, message, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.name, m.email, m.subject || '', m.message, !!m.read, m.createdAt],
    );
  }
  console.log(`mensagens: ${(data.messages || []).length}`);
} else {
  console.log(`${DB_FILE} não encontrado — pulando conteúdo.`);
}

if (fs.existsSync(UPLOAD_DIR)) {
  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => MIME[path.extname(f).slice(1).toLowerCase()]);
  for (const f of files) {
    const buf = fs.readFileSync(path.join(UPLOAD_DIR, f));
    await saveImage(f, MIME[path.extname(f).slice(1).toLowerCase()], buf);
    console.log(`imagem: ${f} (${Math.round(buf.length / 1024)} KB)`);
  }
}

console.log('Importação concluída.');
