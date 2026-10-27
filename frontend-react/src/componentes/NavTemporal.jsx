import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { obtenerDoctores } from '../api/api';

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
  const [doctores, setDoctores] = useState([]);

  useEffect(() => {
    let activo = true;
    obtenerDoctores()
      .then(res => {
        if (activo && res && res.success && Array.isArray(res.data)) {
          setDoctores(res.data);
        }
      })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  const activarPrimerDoctor = () => {
    if (doctores.length > 0) {
      const doc = doctores[0];
      iniciarSesion(doc, 'medico');
    }
  };

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
              👨‍⚕️ {usuario.nombre || 'Médico'} {usuario.cedula ? `(${usuario.cedula})` : ''}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sin sesión</span>
            {doctores.length > 0 ? (
              <select
                aria-label="Seleccionar médico para iniciar sesión"
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.3rem', borderRadius: '4px' }}
                onChange={(e) => {
                  const doc = doctores.find(d => String(d.id) === e.target.value);
                  if (doc) iniciarSesion(doc, 'medico');
                }}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar médico MongoDB</option>
                {doctores.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={activarPrimerDoctor}
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
                + Iniciar sesión
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
