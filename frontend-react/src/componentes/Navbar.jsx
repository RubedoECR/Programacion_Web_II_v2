// Barra de navegación principal (solo se muestra con sesión iniciada).
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { nombrePersona } from '../utils/formato';

const MENU_MEDICO = [
  { to: '/dashboard', texto: '📅 Agenda' },
  { to: '/pacientes', texto: '👥 Pacientes' },
  { to: '/consulta', texto: '🩺 Nueva consulta' },
  { to: '/medicamentos', texto: '💊 Medicamentos' },
  { to: '/reportes', texto: '📊 Reportes' },
  { to: '/perfil', texto: '👤 Mi cuenta' },
];

const MENU_PACIENTE = [
  { to: '/mis-citas', texto: '📅 Mis citas' },
  { to: '/agendar', texto: '⏰ Agendar cita' },
  { to: '/perfil', texto: '👤 Mi cuenta' },
];

export default function Navbar() {
  const { usuario, rol, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const menu = rol === 'medico' ? MENU_MEDICO : MENU_PACIENTE;

  const salir = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="temp-nav no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', background: '#0284c7', color: 'white', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, marginRight: '0.2rem' }}>
          v2.0
        </span>
        {menu.map((opcion) => (
          <NavLink key={opcion.to} to={opcion.to} style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400 })}>
            {opcion.texto}
          </NavLink>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
          {rol === 'medico' ? '👨‍⚕️ ' : '🙂 '}
          {nombrePersona(usuario)}
        </span>
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
