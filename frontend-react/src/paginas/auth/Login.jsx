import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuth } from '../../context/useAuth';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario: sesionActiva, iniciarSesion } = useAuth();

  // Si ya hay sesión, no tiene caso mostrar el login
  if (sesionActiva) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      setError('Por favor, completa usuario y contraseña.');
      return;
    }
    setError('');
    setCargando(true);

    const respuesta = await login(usuario.trim(), password);
    setCargando(false);

    if (respuesta.success) {
      iniciarSesion(respuesta.data);
      navigate(location.state?.desde || '/dashboard', { replace: true });
    } else {
      setError(respuesta.message || 'Credenciales inválidas.');
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">🩺</div>
          <h1>MediVoz</h1>
          <p>Acceso al Portal Médico</p>
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
