// Login con dos tipos de usuario: médico o paciente.
import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { loginMedico, loginPaciente } from '../../api/auth.api';
import { useAuth } from '../../context/useAuth';
import { INICIO } from '../../utils/rutas';

export default function Login() {
  const [tipo, setTipo] = useState('medico'); // 'medico' o 'paciente'
  const [correo, setCorreo] = useState('diego.leal@medivoz.com');
  const [password, setPassword] = useState('Medivoz@2026');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const sesion = useAuth();

  // Si ya hay sesión, se va directo a su página de inicio
  if (sesion.usuario) {
    return <Navigate to={INICIO[sesion.rol]} replace />;
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setError('');
    if (nuevoTipo === 'medico') {
      setCorreo('diego.leal@medivoz.com');
      setPassword('Medivoz@2026');
    } else {
      setCorreo('carlos.gomez@correo.com');
      setPassword('Paciente@2026');
    }
  }

  async function ejecutarLogin(email = correo, pass = password, tipoUsuario = tipo) {
    if (email.trim() === '' || pass === '') {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }

    setError('');
    setCargando(true);
    let respuesta;
    if (tipoUsuario === 'medico') {
      respuesta = await loginMedico(email.trim(), pass);
    } else {
      respuesta = await loginPaciente(email.trim(), pass);
    }
    setCargando(false);

    if (respuesta.success) {
      sesion.iniciarSesion(respuesta.data);
      navigate(INICIO[respuesta.data.rol], { replace: true });
    } else {
      setError(respuesta.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ejecutarLogin();
  }

  const estiloPestana = (activa) => ({
    flex: 1,
    padding: '0.6rem',
    border: 'none',
    borderBottom: activa ? '3px solid var(--primary)' : '3px solid transparent',
    background: 'transparent',
    fontWeight: activa ? 700 : 400,
    color: activa ? 'var(--primary)' : 'var(--text-muted)',
    cursor: 'pointer',
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">🩺</div>
          <h1>MediVoz <span style={{ fontSize: '0.85rem', verticalAlign: 'middle', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #bae6fd' }}>v2.0</span></h1>
          <p>{tipo === 'medico' ? 'Acceso al Portal Médico Institucional' : 'Portal de Pacientes'}</p>
        </div>

        <div style={{ display: 'flex', marginBottom: '1rem' }}>
          <button type="button" style={estiloPestana(tipo === 'medico')} onClick={() => cambiarTipo('medico')}>
            👨‍⚕️ Soy médico
          </button>
          <button type="button" style={estiloPestana(tipo === 'paciente')} onClick={() => cambiarTipo('paciente')}>
            🙂 Soy paciente
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert-error" style={{ fontSize: '0.85rem' }}>{error}</div>}

          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              autoComplete="username"
              placeholder={tipo === 'medico' ? 'ej. diego.leal@medivoz.com' : 'tu.correo@ejemplo.com'}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={cargando} style={{ marginTop: '0.5rem' }}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

          {/* Cuentas de Acceso Rápido */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
              ⚡ Cuentas de Acceso Rápido ({tipo === 'medico' ? 'Médicos' : 'Pacientes'}):
            </div>
            {tipo === 'medico' ? (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setCorreo('diego.leal@medivoz.com');
                    setPassword('Medivoz@2026');
                    ejecutarLogin('diego.leal@medivoz.com', 'Medivoz@2026', 'medico');
                  }}
                >
                  👨‍⚕️ Dr. Diego Leal
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                  onClick={() => {
                    setCorreo('edgar.cepeda@medivoz.com');
                    setPassword('Medivoz@2026');
                    ejecutarLogin('edgar.cepeda@medivoz.com', 'Medivoz@2026', 'medico');
                  }}
                >
                  👨‍⚕️ Dr. Edgar Cepeda
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setCorreo('carlos.gomez@correo.com');
                    setPassword('Paciente@2026');
                    ejecutarLogin('carlos.gomez@correo.com', 'Paciente@2026', 'paciente');
                  }}
                >
                  🙂 Carlos Gómez
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                  onClick={() => {
                    setCorreo('ana.martinez@correo.com');
                    setPassword('Paciente@2026');
                    ejecutarLogin('ana.martinez@correo.com', 'Paciente@2026', 'paciente');
                  }}
                >
                  🙂 Ana Martínez
                </button>
              </div>
            )}
          </div>

          <div className="auth-footer">
            {tipo === 'medico' ? (
              <div>¿Eres médico y no tienes cuenta? <Link to="/registro">Regístrate</Link></div>
            ) : (
              <div>¿Primera vez? <Link to="/registro-paciente">Crea tu cuenta de paciente</Link></div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
