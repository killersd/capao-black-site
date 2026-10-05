import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { EDITORS } from './editors.jsx';

// Formulário de uma seção com rascunho local e botão de salvar.
export function SectionForm({ section, focusId, onSaved, onCancel }) {
  const { content, save } = useStore();
  const [draft, setDraft] = useState(() => structuredClone(content[section]));
  const [status, setStatus] = useState({ busy: false, error: '', ok: false });
  const dirty = JSON.stringify(draft) !== JSON.stringify(content[section]);
  const { Component } = EDITORS[section];

  useEffect(() => {
    const warn = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: '', ok: false });
    try {
      await save(section, draft);
      setStatus({ busy: false, error: '', ok: true });
      onSaved?.();
    } catch (err) {
      setStatus({ busy: false, error: err.message, ok: false });
    }
  };

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-fields">
        <Component value={draft} onChange={setDraft} focusId={focusId} />
      </div>
      <div className="editor-actions">
        {status.error && <span className="f-error">{status.error}</span>}
        {status.ok && !dirty && <span className="f-ok">Salvo.</span>}
        {dirty && !status.busy && <span className="f-dirty">Alterações não salvas</span>}
        {onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (!dirty || confirm('Descartar as alterações?')) onCancel();
            }}
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-accent" disabled={status.busy || !dirty}>
          {status.busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// Painel lateral aberto pelos botões "Editar" do site
export function EditorDrawer() {
  const { editor, closeEditor, isAdmin } = useStore();

  useEffect(() => {
    if (!editor) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [editor]);

  if (!editor || !isAdmin) return null;
  const { title } = EDITORS[editor.section];
  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label={`Editar ${title}`}>
      <aside className="drawer">
        <header className="drawer-head">
          <span className="eyebrow">Editando</span>
          <h2>{title}</h2>
        </header>
        <SectionForm
          key={editor.section + (editor.focusId || '')}
          section={editor.section}
          focusId={editor.focusId}
          onSaved={closeEditor}
          onCancel={closeEditor}
        />
      </aside>
    </div>
  );
}

export function EditButton({ section, focusId, label = 'Editar', className = '' }) {
  const { isAdmin, openEditor } = useStore();
  if (!isAdmin) return null;
  return (
    <button type="button" className={`edit-btn ${className}`} onClick={() => openEditor(section, focusId)}>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
        <path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
