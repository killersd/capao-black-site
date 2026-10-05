import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { uid } from '../lib/utils.js';

export function Field({ label, hint, children }) {
  return (
    <label className="f-field">
      <span className="f-label">{label}</span>
      {children}
      {hint && <span className="f-hint">{hint}</span>}
    </label>
  );
}

export function Text({ label, hint, value, onChange, type = 'text', placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="f-input"
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </Field>
  );
}

export function Area({ label, hint, value, onChange, rows = 5, placeholder, mono }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={`f-input f-area${mono ? ' is-mono' : ''}`}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select className="f-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="f-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="f-toggle-ui" aria-hidden />
      <span>{label}</span>
    </label>
  );
}

export function Row({ children }) {
  return <div className="f-row">{children}</div>;
}

function useUploader(max) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (files) => {
    if (!files?.length) return [];
    setBusy(true);
    setError('');
    try {
      const { urls } = await api.upload(files, max);
      return urls;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

// Uma imagem: envio de arquivo ou URL manual
export function ImageField({ label, value, onChange, max, aspect = '16/10' }) {
  const input = useRef(null);
  const { busy, error, run } = useUploader(max);
  return (
    <div className="f-field">
      <span className="f-label">{label}</span>
      <div className="f-image">
        <div className="f-image-preview" style={{ aspectRatio: aspect }}>
          {value ? <img src={value} alt="" /> : <span>Sem imagem</span>}
          {busy && <div className="f-busy">Enviando…</div>}
        </div>
        <div className="f-image-actions">
          <button type="button" className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}>
            Enviar imagem
          </button>
          {value && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>
              Remover
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const [url] = await run(e.target.files);
              if (url) onChange(url);
              e.target.value = '';
            }}
          />
          <input
            className="f-input f-input-sm"
            placeholder="ou cole a URL da imagem"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <span className="f-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}

// Várias fotos de uma vez, com legenda e reordenação
export function PhotoGrid({ value = [], onChange }) {
  const input = useRef(null);
  const { busy, error, run } = useUploader(2200);
  const [dragOver, setDragOver] = useState(false);

  const add = async (files) => {
    const urls = await run(files);
    if (urls.length) onChange([...value, ...urls.map((src) => ({ id: uid(), src, caption: '' }))]);
  };
  const update = (id, patch) => onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="f-photos">
      <div
        className={`f-drop${dragOver ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
      >
        {busy ? 'Enviando fotos…' : 'Arraste fotos aqui ou clique para escolher (várias de uma vez)'}
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <span className="f-error">{error}</span>}
      <div className="f-photo-grid">
        {value.map((p, i) => (
          <div key={p.id} className="f-photo">
            <img src={p.src} alt="" />
            <input
              className="f-input f-input-sm"
              placeholder="Legenda"
              value={p.caption ?? ''}
              onChange={(e) => update(p.id, { caption: e.target.value })}
            />
            <div className="f-photo-actions">
              <button type="button" onClick={() => move(i, -1)} aria-label="Mover para trás" disabled={i === 0}>←</button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Mover para frente" disabled={i === value.length - 1}>→</button>
              <button type="button" className="is-danger" onClick={() => onChange(value.filter((x) => x.id !== p.id))}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lista genérica de itens editáveis, recolhíveis e reordenáveis
export function ListEditor({ items = [], onChange, create, summary, render, addLabel = 'Adicionar', openId, addToTop }) {
  const [open, setOpen] = useState(() => new Set(openId ? [openId] : []));
  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const update = (id, patch) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    const item = { id: uid(), ...create() };
    onChange(addToTop ? [item, ...items] : [...items, item]);
    setOpen((s) => new Set(s).add(item.id));
  };

  return (
    <div className="f-list">
      <button type="button" className="btn btn-sm btn-accent f-list-add" onClick={add}>
        + {addLabel}
      </button>
      {items.length === 0 && <p className="f-empty">Nada cadastrado ainda.</p>}
      {items.map((it, i) => (
        <div key={it.id} className={`f-item${open.has(it.id) ? ' is-open' : ''}`}>
          <div className="f-item-head">
            <button type="button" className="f-item-title" onClick={() => toggle(it.id)}>
              <span className="f-item-caret">{open.has(it.id) ? '−' : '+'}</span>
              {summary(it) || 'Sem título'}
            </button>
            <div className="f-item-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descer">↓</button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  if (confirm('Excluir este item?')) onChange(items.filter((x) => x.id !== it.id));
                }}
              >
                Excluir
              </button>
            </div>
          </div>
          {open.has(it.id) && <div className="f-item-body">{render(it, (patch) => update(it.id, patch))}</div>}
        </div>
      ))}
    </div>
  );
}
