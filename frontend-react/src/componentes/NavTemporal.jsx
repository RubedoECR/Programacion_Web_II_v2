import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const rutas = [
  { to: '/dashboard', texto: '📅 Agenda (Dashboard)' },
  { to: '/pacientes', texto: '👥 Directorio Pacientes' },
  { to: '/consulta/1', texto: '🩺 Consulta Médica' },
  { to: '/historial/1', texto: '📋 Historial Clínico' },
  { to: '/receta/1', texto: '📄 Receta Médica' },
  { to: '/paciente/agendar', texto: '⏰ Agendar Cita' },
  { to: '/paciente/nuevo', texto: '➕ Nuevo Paciente' },
  { to: '/login', texto: '🔐 Login Médico' },
  { to: '/login-paciente', texto: '👤 Portal Paciente' },
  { to: '/registro', texto: '📝 Registro Médico' },
];

export default function NavTemporal() {
  const { usuario, cerrarSesion, iniciarSesion } = useAuth();

  return (
    <nav className="temp-nav no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        <strong>⚡ Atajos:</strong>
        {rutas.map(r => (
          <span key={r.to}>
            <Link to={r.to}>{r.texto}</Link>
          </span>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {usuario ? (
          <>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
              👨‍⚕️ {usuario.nombre || 'Dr. Diego Leal'}
            </span>
            <button
              type="button"
              onClick={cerrarSesion}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: '0.15rem 0.4rem',
                color: '#64748b'
              }}
            >
              Salir
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => iniciarSesion({ id: 'doc-diego-leal', nombre: 'Dr. Diego Leal', rol: 'medico' })}
            style={{
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              color: 'white',
              fontWeight: 700
            }}
          >
            + Activar sesión médica
          </button>
        )}
      </div>
    </nav>
  );
}
