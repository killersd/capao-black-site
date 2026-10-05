import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page not-found">
      <div className="wrap">
        <p className="mono">404</p>
        <h1>Página não encontrada</h1>
        <Link to="/" className="btn">Voltar ao início</Link>
      </div>
    </section>
  );
}
