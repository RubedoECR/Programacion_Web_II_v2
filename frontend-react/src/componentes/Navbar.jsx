// Barra de navegación. Muestra opciones distintas para médicos y para pacientes.
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const MENU_MEDICO = [
  { to: '/dashboard', texto: '📅 Agenda' },
  { to: '/consulta', texto: '🩺 Nueva consulta' },
  { to: '/pacientes', texto: '👥 Pacientes' },
  { to: '/reportes', texto: '📊 Reportes' },
  { to: '/medicamentos', texto: '💊 Medicamentos' },
];

const MENU_PACIENTE = [
  { to: '/portal/agendar', texto: '⏰ Agendar cita' },
  { to: '/portal/mis-citas', texto: '📋 Mis citas' },
];

export default function Navbar() {
  const { usuario, rol, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const menu = rol === 'medico' ? MENU_MEDICO : MENU_PACIENTE;
  const nombre = rol === 'medico' ? 'Dr. ' + usuario.nombre + ' ' + (usuario.apellidoP || '') : usuario.nombre;

  function salir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="temp-nav no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {menu.map((opcion) => (
          <NavLink key={opcion.to} to={opcion.to} style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400 })}>
            {opcion.texto}
          </NavLink>
        ))}
      </div>

      <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {rol === 'medico' ? (
          <NavLink to="/mi-perfil" style={{ color: 'var(--primary)', fontWeight: 700 }}>👨‍⚕️ {nombre}</NavLink>
        ) : (
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>🙂 {nombre} · {usuario.expediente}</span>
        )}
        <button type="button" className="btn-secondary" onClick={salir} style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
