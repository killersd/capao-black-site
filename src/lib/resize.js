// Reduz a imagem no navegador antes do envio (a Vercel aceita no máximo 4,5 MB por requisição).
// JPG/HEIC viram JPEG; PNG/WebP/GIF viram WebP para manter transparência.
const MAX_BYTES = 3.8 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível ler "${file.name}". Use JPG, PNG ou WebP.`));
    };
    img.src = url;
  });
}

const toBlob = (canvas, type, quality) => new Promise((r) => canvas.toBlob(r, type, quality));

export async function resizeImage(file, maxSide = 2000) {
  const { img, url } = await loadImage(file);
  try {
    const keepAlpha = /png|webp|gif/.test(file.type);
    const type = keepAlpha ? 'image/webp' : 'image/jpeg';
    let side = maxSide;
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!keepAlpha) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await toBlob(canvas, type, 0.84);
      if (blob && blob.size <= MAX_BYTES) return blob;
      side = Math.round(side * 0.75);
    }
    throw new Error(`"${file.name}" continua grande demais mesmo reduzida.`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
