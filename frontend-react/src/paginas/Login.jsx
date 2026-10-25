import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import NavTemporal from '../componentes/NavTemporal';

export default function Login() {
  const [usuario, setUsuario] = useState('diego.leal@medivoz.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [servidorOffline, setServidorOffline] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const ingresarModoLocal = (datosDoc = null) => {
    const sesion = datosDoc || {
      id: 'doc-diego-leal',
      nombre: 'Dr. Diego Leal',
      usuario: usuario || 'diego.leal@medivoz.com',
      especialidad: 'Medicina General',
      cedula: 'CED-8492018'
    };
    iniciarSesion(sesion, 'medico');
    navigate('/dashboard');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Por favor, completa usuario y contraseña.');
      return;
    }
    setError('');
    setServidorOffline(false);
    setCargando(true);

    try {
      const respuesta = await login(usuario.trim(), password.trim());
      if (respuesta.success) {
        iniciarSesion(respuesta.data, 'medico');
        navigate('/dashboard');
      } else {
        setError(respuesta.message || 'Credenciales inválidas.');
      }
    } catch (err) {
      setServidorOffline(true);
      setError('No se pudo conectar con el servidor backend (puerto 3000).');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <NavTemporal />
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
                <div>{error}</div>
                {servidorOffline && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        fontSize: '0.82rem',
                        padding: '0.45rem',
                        backgroundColor: '#ffffff',
                        borderColor: '#ef4444',
                        color: '#b91c1c'
                      }}
                      onClick={() => ingresarModoLocal()}
                    >
                      ⚡ Entrar en Modo Local / Demo
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="usuario">Usuario / Correo Institucional</label>
              <input
                id="usuario"
                placeholder="ej. diego.leal@medivoz.com o test123"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={cargando} style={{ marginTop: '0.5rem' }}>
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            {/* Acceso Rápido de 1 Clic */}
            <button
              type="button"
              className="btn-secondary"
              style={{
                width: '100%',
                marginTop: '0.5rem',
                fontSize: '0.82rem',
                padding: '0.55rem',
                borderStyle: 'dashed'
              }}
              onClick={() => ingresarModoLocal()}
            >
              ⚡ Acceso Directo (Dr. Diego Leal)
            </button>

            <div style={{ marginTop: '1rem', padding: '0.65rem', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong>Credenciales de prueba:</strong>
              <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                  onClick={() => { setUsuario('diego.leal@medivoz.com'); setPassword('password123'); }}
                >
                  Dr. Diego Leal
                </span>
                <span>·</span>
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                  onClick={() => { setUsuario('test123'); setPassword('Test@12345'); }}
                >
                  Dr. Test
                </span>
              </div>
            </div>

            <div className="auth-footer">
              <div>
                ¿No tienes cuenta? <Link to="/registro">Registrarse como médico</Link>
              </div>
              <div>
                <Link to="/login-paciente">Ingresar como Paciente →</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
