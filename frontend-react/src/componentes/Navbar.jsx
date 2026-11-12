// Barra de navegación principal (solo se muestra con sesión iniciada).
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { nombreMedico } from '../utils/formato';

const RUTAS = [
  { to: '/dashboard', texto: '📅 Agenda' },
  { to: '/pacientes', texto: '👥 Pacientes' },
  { to: '/consulta', texto: '🩺 Nueva consulta' },
  { to: '/paciente/agendar', texto: '⏰ Agendar cita' },
  { to: '/paciente/nuevo', texto: '➕ Nuevo paciente' },
  { to: '/reportes', texto: '📊 Reportes' },
];

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const salir = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="temp-nav no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        {RUTAS.map((r) => (
          <NavLink key={r.to} to={r.to} end style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400 })}>
            {r.texto}
          </NavLink>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>👨‍⚕️ {nombreMedico(usuario)}</span>
        <button
          type="button"
          onClick={salir}
          style={{
            background: 'transparent',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            padding: '0.15rem 0.4rem',
            color: '#64748b',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
