import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuth } from '../../context/useAuth';

export default function Login() {
  const [usuario, setUsuario] = useState('diego.leal@medivoz.com');
  const [password, setPassword] = useState('Medivoz@2026');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario: sesionActiva, iniciarSesion } = useAuth();

  // Si ya hay sesión, no tiene caso mostrar el login
  if (sesionActiva) return <Navigate to="/dashboard" replace />;

  async function ejecutarLogin(correo = usuario, clave = password) {
    if (!correo.trim() || !clave) {
      setError('Por favor, completa usuario y contraseña.');
      return;
    }
    setError('');
    setCargando(true);

    const respuesta = await login(correo.trim(), clave);
    setCargando(false);

    if (respuesta.success) {
      iniciarSesion(respuesta.data);
      navigate(location.state?.desde || '/dashboard', { replace: true });
    } else {
      setError(respuesta.message || 'Credenciales inválidas.');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ejecutarLogin();
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">🩺</div>
          <h1>MediVoz <span style={{ fontSize: '0.85rem', verticalAlign: 'middle', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #bae6fd' }}>v2.0</span></h1>
          <p>Acceso al Portal Médico Institucional</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-error" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="usuario">Correo Institucional</label>
            <input
              id="usuario"
              autoComplete="username"
              placeholder="ej. diego.leal@medivoz.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

          {/* Acceso Rápido / Credenciales de Prueba */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: '#1e293b' }}>
              ⚡ Cuentas de Acceso Rápido (v2.0):
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setUsuario('diego.leal@medivoz.com');
                  setPassword('Medivoz@2026');
                  ejecutarLogin('diego.leal@medivoz.com', 'Medivoz@2026');
                }}
              >
                👨‍⚕️ Entrar como Dr. Diego Leal
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                onClick={() => {
                  setUsuario('edgar.cepeda@medivoz.com');
                  setPassword('Medivoz@2026');
                  ejecutarLogin('edgar.cepeda@medivoz.com', 'Medivoz@2026');
                }}
              >
                👨‍⚕️ Dr. Edgar Cepeda
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <div>
              ¿No tienes cuenta? <Link to="/registro">Registrarse como médico</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
