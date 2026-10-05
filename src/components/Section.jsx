import { EditButton } from '../admin/EditorPanel.jsx';

export function Section({ id, index, title, section, className = '', actions, children }) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="wrap">
        <header className="section-head">
          <span className="section-index mono">{String(index).padStart(2, '0')}</span>
          <h2 className="section-title">{title}</h2>
          <div className="section-actions">
            {actions}
            {section && <EditButton section={section} />}
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}
