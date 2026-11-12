// Login con dos tipos de usuario: médico o paciente.
import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { loginMedico, loginPaciente } from '../../api/auth.api';
import { useAuth } from '../../context/useAuth';
import { INICIO } from '../../utils/rutas';

export default function Login() {
  const [tipo, setTipo] = useState('medico'); // 'medico' o 'paciente'
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (correo.trim() === '' || password === '') {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }

    setError('');
    setCargando(true);
    let respuesta;
    if (tipo === 'medico') {
      respuesta = await loginMedico(correo.trim(), password);
    } else {
      respuesta = await loginPaciente(correo.trim(), password);
    }
    setCargando(false);

    if (respuesta.success) {
      sesion.iniciarSesion(respuesta.data);
      navigate(INICIO[respuesta.data.rol], { replace: true });
    } else {
      setError(respuesta.message);
    }
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
          <h1>MediVoz</h1>
          <p>{tipo === 'medico' ? 'Acceso al Portal Médico' : 'Portal de Pacientes'}</p>
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
