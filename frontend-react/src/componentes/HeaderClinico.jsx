// Encabezado institucional que aparece en las páginas del sistema.
import { Link } from 'react-router-dom';

export default function HeaderClinico() {
  return (
    <header className="institutional-header">
      <div className="container-logo">
        <Link to="/dashboard" className="logo">
          Medi<span>Voz</span>
        </Link>
        <div className="subtitle">Sistema de Registro Médico por Dictado</div>
      </div>
    </header>
  );
}
