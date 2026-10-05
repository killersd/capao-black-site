// Gera versões otimizadas do logo e da foto da banda a partir de /imagens.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC_LOGO = 'imagens/Logo Capão Black HD.png';
const SRC_PHOTO = 'imagens/IMG_8179.jpg';
const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

// Logo preto sobre branco -> tinta branca com transparência (alpha = luminância invertida)
async function inkToWhite(input, output, width) {
  const alpha = await sharp(input).greyscale().negate().resize({ width }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = alpha.info;
  await sharp({ create: { width: w, height: h, channels: 3, background: '#ffffff' } })
    .joinChannel(alpha.data, { raw: { width: w, height: h, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

const trimmed = await sharp(SRC_LOGO).flatten({ background: '#fff' }).trim({ threshold: 40 }).toBuffer();
await inkToWhite(trimmed, `${OUT}/logo.png`, 1600);

// Emblema (sol/galo) recortado do logo já convertido (coordenadas relativas à largura de 1600px)
// A máscara mantém tudo acima das letras e, abaixo disso, só o círculo do emblema.
const emblemMask = Buffer.from(`<svg width="545" height="405" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="545" height="268" fill="#fff"/>
  <circle cx="297" cy="228" r="160" fill="#fff"/>
</svg>`);
const emblemRaw = await sharp(`${OUT}/logo.png`)
  .extract({ left: 530, top: 0, width: 545, height: 405 })
  .composite([{ input: emblemMask, blend: 'dest-in' }]).png().toBuffer();
// Remove pontas de letras que ainda tocam o círculo
const emblemCut = Buffer.from(`<svg width="545" height="405" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="258" width="95" height="147" fill="#000"/>
  <rect x="338" y="347" width="30" height="58" fill="#000"/>
  <rect x="352" y="341" width="193" height="64" fill="#000"/>
</svg>`);
const emblemClean = await sharp(emblemRaw).composite([{ input: emblemCut, blend: 'dest-out' }]).png().toBuffer();
const emblem = await sharp(emblemClean).trim({ threshold: 10 }).toBuffer();
await sharp(emblem).resize({ width: 512 }).png({ compressionLevel: 9 }).toFile(`${OUT}/emblem.png`);

// Favicon: emblema branco sobre quadrado escuro
const em = await sharp(`${OUT}/emblem.png`).resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
await sharp({ create: { width: 256, height: 256, channels: 4, background: '#0d0c0b' } })
  .composite([{ input: em, gravity: 'center' }]).png().toFile(`${OUT}/favicon.png`);

// Foto da banda
for (const w of [2400, 1400, 800]) {
  await sharp(SRC_PHOTO).rotate().resize({ width: w }).jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/banda-${w}.jpg`);
}
console.log('Imagens geradas em', OUT);
