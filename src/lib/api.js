import { resizeImage } from './resize.js';

const TOKEN_KEY = 'cb_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

async function request(method, url, body, { raw } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (raw) headers['Content-Type'] = raw;
  else if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: raw ? body : body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  content: () => request('GET', '/api/content'),
  save: (section, value) => request('PUT', `/api/content/${section}`, { value }),
  login: (user, password) => request('POST', '/api/login', { user, password }),
  me: () => request('GET', '/api/me'),
  // envia uma imagem por requisição, já reduzida no navegador
  upload: async (files, max = 2000) => {
    const urls = [];
    for (const file of files) {
      const blob = await resizeImage(file, max);
      const { url } = await request('POST', '/api/upload', blob, { raw: blob.type });
      urls.push(url);
    }
    return { urls };
  },
  sendMessage: (msg) => request('POST', '/api/messages', msg),
  messages: () => request('GET', '/api/messages'),
  markMessage: (id, read) => request('PATCH', `/api/messages/${id}`, { read }),
  deleteMessage: (id) => request('DELETE', `/api/messages/${id}`),
};
