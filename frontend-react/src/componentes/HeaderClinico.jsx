// Encabezado institucional que aparece en las páginas del sistema.
import { Link } from 'react-router-dom';

export default function HeaderClinico() {
  return (
    <header className="institutional-header">
      <div className="container-logo">
        <Link to="/dashboard" className="logo">
          Medi<span>Voz</span> <span style={{ fontSize: '0.65rem', verticalAlign: 'middle', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #bae6fd', marginLeft: '0.4rem', textTransform: 'none', letterSpacing: 'normal' }}>v2.0</span>
        </Link>
        <div className="subtitle">Sistema de Registro Médico por Dictado</div>
      </div>
    </header>
  );
}
