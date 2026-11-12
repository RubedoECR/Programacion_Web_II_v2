// Formulario de datos del paciente.
// Se usa en dos lugares:
//  - Registro del paciente (conCuenta = true → pide también correo y contraseña)
//  - Edición del paciente por el médico (conCuenta = false → incluye el estado Activo/Inactivo)
import { useState } from 'react';

const VACIO = {
  nombre: '',
  apellidoP: '',
  apellidoM: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  tipoSangre: '',
  direccion: '',
  alergias: '',
  contactoNombre: '',
  contactoParentesco: '',
  contactoTelefono: '',
  estado: 'Activo',
  correo: '',
  password: '',
  confirmarPassword: '',
};

// Validaciones del lado del frontend (el backend vuelve a validar)
function revisar(form, conCuenta) {
  if (form.nombre.trim() === '') return 'El nombre es obligatorio.';
  if (form.apellidoP.trim() === '') return 'El apellido paterno es obligatorio.';
  if (form.fechaNacimiento === '') return 'La fecha de nacimiento es obligatoria.';
  if (new Date(form.fechaNacimiento) > new Date()) return 'La fecha de nacimiento no puede ser futura.';
  if (form.sexo === '') return 'Selecciona el sexo.';
  if (form.telefono.replace(/\D/g, '').length < 10) return 'El teléfono debe tener al menos 10 dígitos.';

  if (conCuenta) {
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) return 'Escribe un correo válido.';
    if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,15}$/.test(form.password)) {
      return 'La contraseña debe tener de 8 a 15 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*).';
    }
    if (form.password !== form.confirmarPassword) return 'Las contraseñas no coinciden.';
  }
  return '';
}

export default function FormularioPaciente({ titulo, textoBoton, conCuenta, valoresIniciales, cargando, onGuardar, onCancelar }) {
  const [form, setForm] = useState(valoresIniciales || VACIO);
  const [error, setError] = useState('');

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function enviar(e) {
    e.preventDefault();
    const mensaje = revisar(form, conCuenta);
    setError(mensaje);
    if (mensaje === '') {
      const datos = { ...form };
      delete datos.confirmarPassword;
      if (!conCuenta) {
        delete datos.correo;
        delete datos.password;
      }
      onGuardar(datos);
    }
  }

  // Pequeño ayudante para no repetir el mismo bloque en cada campo
  function campo(nombre, etiqueta, tipo = 'text', placeholder = '') {
    return (
      <div className="Campo">
        <label htmlFor={nombre}>{etiqueta}</label>
        <input id={nombre} name={nombre} type={tipo} placeholder={placeholder} className="Text-box" value={form[nombre]} onChange={cambiar} />
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <h1 className="Titulo full-width">{titulo}</h1>

      {error && <div className="alert-error full-width">{error}</div>}

      {campo('nombre', 'Nombre *')}
      {campo('apellidoP', 'Apellido paterno *')}
      {campo('apellidoM', 'Apellido materno')}
      {campo('fechaNacimiento', 'Fecha de nacimiento *', 'date')}

      <div className="Campo">
        <label htmlFor="sexo">Sexo *</label>
        <select id="sexo" name="sexo" className="Text-box" value={form.sexo} onChange={cambiar}>
          <option value="">Selecciona...</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      {campo('telefono', 'Teléfono *', 'tel', '10 dígitos')}

      <div className="Campo">
        <label htmlFor="tipoSangre">Tipo de sangre</label>
        <select id="tipoSangre" name="tipoSangre" className="Text-box" value={form.tipoSangre} onChange={cambiar}>
          <option value="">No sé / no especificar</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {campo('alergias', 'Alergias', 'text', 'Separadas por coma (ej. Penicilina, Polen)')}

      <div className="Campo full-width">
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" name="direccion" className="Text-box" value={form.direccion} onChange={cambiar} />
      </div>

      {campo('contactoNombre', 'Contacto de emergencia')}
      {campo('contactoParentesco', 'Parentesco')}
      {campo('contactoTelefono', 'Teléfono del contacto', 'tel')}

      {!conCuenta && (
        <div className="Campo">
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" className="Text-box" value={form.estado} onChange={cambiar}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      )}

      {conCuenta && (
        <>
          <h3 className="full-width" style={{ marginTop: '0.5rem' }}>Datos de tu cuenta</h3>
          <div className="Campo full-width">
            <label htmlFor="correo">Correo electrónico *</label>
            <input id="correo" name="correo" type="email" className="Text-box" value={form.correo} onChange={cambiar} />
          </div>
          {campo('password', 'Contraseña *', 'password')}
          {campo('confirmarPassword', 'Confirmar contraseña *', 'password')}
        </>
      )}

      <div className="full-width" style={{ display: 'flex', gap: '10px' }}>
        <button className="Btn_Login" type="submit" disabled={cargando} style={{ flex: 1 }}>
          {cargando ? 'Guardando...' : textoBoton}
        </button>
        <button className="Btn_Registrarse" type="button" onClick={onCancelar} style={{ flex: 1 }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
