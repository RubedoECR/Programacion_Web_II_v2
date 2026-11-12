// El médico ve y edita sus propios datos, o elimina su cuenta.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { actualizarDoctor, eliminarDoctor } from '../../api/doctores.api';
import { useAuth } from '../../context/useAuth';
import '../../estilos/App.css';

export default function MiPerfil() {
  const { usuario, actualizarUsuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: usuario.nombre || '',
    apellidoP: usuario.apellidoP || '',
    apellidoM: usuario.apellidoM || '',
    especialidad: usuario.especialidad || '',
    cedula: usuario.cedula || '',
    telefono: usuario.telefono || '',
    email: usuario.email || '',
    password: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function guardar(e) {
    e.preventDefault();
    if (form.nombre.trim() === '') {
      setError('El nombre es obligatorio.');
      return;
    }

    const datos = { ...form };
    if (datos.password === '') delete datos.password; // vacío = no cambiar la contraseña

    const respuesta = await actualizarDoctor(usuario._id, datos);
    if (respuesta.success) {
      actualizarUsuario(respuesta.data);
      setForm({ ...form, password: '' });
      setMensaje('Tus datos se guardaron.');
      setError('');
    } else {
      setError(respuesta.message);
      setMensaje('');
    }
  }

  async function eliminarCuenta() {
    if (!window.confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    const respuesta = await eliminarDoctor(usuario._id);
    if (respuesta.success) {
      cerrarSesion();
      navigate('/login', { replace: true });
    } else {
      setError(respuesta.message);
    }
  }

  function campo(nombre, etiqueta, tipo = 'text', placeholder = '') {
    return (
      <div className="form-group">
        <label htmlFor={nombre}>{etiqueta}</label>
        <input id={nombre} name={nombre} type={tipo} placeholder={placeholder} value={form[nombre]} onChange={cambiar} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container" style={{ maxWidth: '820px' }}>
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">👨‍⚕️</span>
            <span>Mi perfil</span>
          </div>

          {mensaje && <div className="alert-success">{mensaje}</div>}
          {error && <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

          <form onSubmit={guardar}>
            <div className="fila-formulario">
              {campo('nombre', 'Nombre')}
              {campo('apellidoP', 'Apellido paterno')}
              {campo('apellidoM', 'Apellido materno')}
            </div>
            <div className="fila-formulario">
              {campo('especialidad', 'Especialidad')}
              {campo('cedula', 'Cédula profesional')}
              {campo('telefono', 'Teléfono')}
            </div>
            <div className="fila-formulario">
              {campo('email', 'Correo', 'email')}
              {campo('password', 'Nueva contraseña', 'password', 'Déjala vacía para no cambiarla')}
            </div>
            <button type="submit" className="btn-primary">Guardar cambios</button>
          </form>

          <hr style={{ margin: '1.5rem 0' }} />
          <button type="button" className="btn-danger" onClick={eliminarCuenta}>
            Eliminar mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
