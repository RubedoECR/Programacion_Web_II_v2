import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarMedico } from '../../api/auth.api';
import '../../estilos/Registro.css';

export default function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    especialidad: '',
    telefono: '',
    fechaNacimiento: '',
    correo: '',
    cedulaNombre: '',
    password: '',
    confirmPassword: ''
  });

  const [toast, setToast] = useState({ mensaje: '', tipo: '', visible: false });
  const [invalidField, setInvalidField] = useState('');
  const [cargando, setCargando] = useState(false);

  const toastTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const mostrarToast = (msg, tipo = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ mensaje: msg, tipo, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast({ mensaje: '', tipo: '', visible: false });
    }, 2800);
  };

  const marcarCampoInvalido = (fieldName) => {
    setInvalidField(fieldName);
    setTimeout(() => {
      setInvalidField('');
    }, 1600);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      cedulaNombre: file ? file.name : ''
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      nombre,
      apellidoP,
      apellidoM,
      especialidad,
      telefono,
      fechaNacimiento,
      correo,
      cedulaNombre,
      password,
      confirmPassword
    } = formData;

    if (
      !nombre.trim() ||
      !apellidoP.trim() ||
      !apellidoM.trim() ||
      !especialidad.trim() ||
      !telefono.trim() ||
      !fechaNacimiento ||
      !correo.trim() ||
      !cedulaNombre ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      mostrarToast('Datos incompletos. Por favor llena todos los campos.', 'error');
      return;
    }

    const fecha = new Date(fechaNacimiento);
    const fechaLimite = new Date('2002-01-01');

    if (fecha > fechaLimite) {
      mostrarToast('La fecha de nacimiento no puede ser posterior al 1 de enero de 2002.', 'error');
      marcarCampoInvalido('fechaNacimiento');
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha > hoy) {
      mostrarToast('La fecha de nacimiento no puede ser futura.', 'error');
      marcarCampoInvalido('fechaNacimiento');
      return;
    }

    const numeroLimpio = telefono.replace(/\D/g, '');
    if (numeroLimpio.length < 10) {
      mostrarToast('El número de teléfono debe tener mínimo 10 dígitos.', 'error');
      marcarCampoInvalido('telefono');
      return;
    }

    if (password !== confirmPassword) {
      mostrarToast('Las contraseñas no coinciden.', 'error');
      marcarCampoInvalido('confirmPassword');
      return;
    }

    const formatoPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,15}$/;
    if (!formatoPassword.test(password)) {
      mostrarToast(
        'La contraseña debe tener entre 8 y 15 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*).',
        'error'
      );
      marcarCampoInvalido('password');
      return;
    }

    setCargando(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        apellidoP: apellidoP.trim(),
        apellidoM: apellidoM.trim(),
        especialidad: especialidad.trim(),
        telefono: numeroLimpio,
        fechaNacimiento,
        email: correo.trim(),
        cedula: cedulaNombre,
        password
      };

      const respuesta = await registrarMedico(payload);

      if (respuesta.success) {
        mostrarToast('Registro exitoso. Redirigiendo...', 'exito');
        setTimeout(() => {
          navigate('/login');
        }, 1300);
      } else {
        mostrarToast(respuesta.message || 'Error al registrar doctor.', 'error');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-page">
      <header>
        <div className="container-logo">
          <div className="logo">
            Medi<span>Voz</span>
          </div>
          <div className="subtitle">Sistema de Registro Médico por Dictado</div>
        </div>
      </header>

      <div className="form-page">
        <div className="Formulario_Registro">
          <form id="formRegistro" onSubmit={handleSubmit}>
            <h1 className="Titulo full-width">Registrarse</h1>

            <div className="Campo">
              <label htmlFor="Nombre">Nombre</label>
              <input
                id="Nombre"
                name="nombre"
                className={`Text-box ${invalidField === 'nombre' ? 'campo-invalido' : ''}`}
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Ape_P">Apellido Paterno</label>
              <input
                id="Ape_P"
                name="apellidoP"
                className={`Text-box ${invalidField === 'apellidoP' ? 'campo-invalido' : ''}`}
                type="text"
                placeholder="Apellido Paterno"
                value={formData.apellidoP}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Ape_M">Apellido Materno</label>
              <input
                id="Ape_M"
                name="apellidoM"
                className={`Text-box ${invalidField === 'apellidoM' ? 'campo-invalido' : ''}`}
                type="text"
                placeholder="Apellido Materno"
                value={formData.apellidoM}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Especialidad">Especialidad</label>
              <input
                id="Especialidad"
                name="especialidad"
                className={`Text-box ${invalidField === 'especialidad' ? 'campo-invalido' : ''}`}
                type="text"
                placeholder="Especialidad"
                value={formData.especialidad}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Telefono">Número de teléfono</label>
              <input
                id="Telefono"
                name="telefono"
                className={`Text-box ${invalidField === 'telefono' ? 'campo-invalido' : ''}`}
                type="text"
                placeholder="Número de teléfono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Fecha_Nacimiento">Fecha de nacimiento</label>
              <input
                id="Fecha_Nacimiento"
                name="fechaNacimiento"
                className={`Text-box ${invalidField === 'fechaNacimiento' ? 'campo-invalido' : ''}`}
                type="date"
                placeholder="Fecha de nacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Corre_Electronico">Correo Electrónico</label>
              <input
                id="Corre_Electronico"
                name="correo"
                className={`Text-box ${invalidField === 'correo' ? 'campo-invalido' : ''}`}
                type="email"
                placeholder="Correo Electrónico"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>

            <div className="Campo">
              <label htmlFor="Cedula">Cargar Cedula</label>
              <input
                id="Cedula"
                name="cedula"
                ref={fileInputRef}
                className={`fileup ${invalidField === 'cedula' ? 'campo-invalido' : ''}`}
                type="file"
                onChange={handleFileChange}
              />
            </div>

            <div className="Campo full-width">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                className={`Text-box ${invalidField === 'password' ? 'campo-invalido' : ''}`}
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="Campo full-width">
              <label htmlFor="confirm_password">Confirmar Contraseña</label>
              <input
                id="confirm_password"
                name="confirmPassword"
                className={`Text-box ${invalidField === 'confirmPassword' ? 'campo-invalido' : ''}`}
                type="password"
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="full-width" style={{ display: 'flex', gap: '10px' }}>
              <button className="Btn_Login" type="submit" disabled={cargando} style={{ flex: 1 }}>
                {cargando ? 'Registrando...' : 'Enviar Registro'}
              </button>
              <button
                className="Btn_Registrarse"
                type="button"
                onClick={() => navigate('/login')}
                style={{ flex: 1 }}
              >
                Regresar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        id="toast"
        className={`${toast.visible ? 'show' : ''} ${toast.tipo === 'error' ? 'toast-error' : ''}`}
      >
        {toast.mensaje}
      </div>
    </div>
  );
}
