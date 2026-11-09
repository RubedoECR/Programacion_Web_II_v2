import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import { registrarPaciente } from '../../api/pacientes.api';
import '../../estilos/Registro.css';

export default function PacienteNuevo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    correo: '',
    tipoSangre: '',
    direccion: '',
    alergias: '',
    contactoNombre: '',
    contactoParentesco: '',
    contactoTelefono: ''
  });

  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: '' });
  const [invalido, setInvalido] = useState('');
  const [registrado, setRegistrado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const mostrarToast = (mensaje, tipo = '') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: '' }), 2800);
  };

  const marcarInvalido = (campo) => {
    setInvalido(campo);
    setTimeout(() => setInvalido(''), 1600);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.apellidoP.trim() || !form.fechaNacimiento || !form.sexo || !form.telefono.trim()) {
      mostrarToast('Completa al menos Nombre, Apellido Paterno, Fecha de nacimiento, Sexo y Teléfono.', 'error');
      if (!form.nombre.trim()) marcarInvalido('nombre');
      else if (!form.apellidoP.trim()) marcarInvalido('apellidoP');
      else if (!form.fechaNacimiento) marcarInvalido('fechaNacimiento');
      else if (!form.sexo) marcarInvalido('sexo');
      else marcarInvalido('telefono');
      return;
    }

    const fechaNac = new Date(form.fechaNacimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaNac > hoy) {
      mostrarToast('La fecha de nacimiento no puede ser una fecha futura.', 'error');
      marcarInvalido('fechaNacimiento');
      return;
    }

    const numLimpio = form.telefono.replace(/\D/g, '');
    if (numLimpio.length < 10) {
      mostrarToast('El teléfono debe tener un mínimo de 10 dígitos.', 'error');
      marcarInvalido('telefono');
      return;
    }

    setCargando(true);
    const res = await registrarPaciente(form);
    setCargando(false);

    if (res.success) {
      setRegistrado(res.data.expediente);
      mostrarToast('¡Paciente registrado exitosamente!');
    } else {
      mostrarToast(res.message || 'No se pudo registrar al paciente.', 'error');
    }
  };

  return (
    <div className="registro-page">
      <Navbar />

      <header className="container-logo">
        <div className="logo">
          Medi<span>Voz</span>
        </div>
        <div className="subtitle">Sistema de Registro Médico por Dictado</div>
      </header>

      <div className="form-page">
        <div className="Formulario_Registro">
          {!registrado ? (
            <form onSubmit={handleSubmit}>
              <h1 className="Titulo full-width">Registrar Paciente</h1>

              <div className="Campo">
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Nombre de pila"
                  className={`Text-box ${invalido === 'nombre' ? 'campo-invalido' : ''}`}
                  value={form.nombre}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="apellidoP">Apellido Paterno</label>
                <input
                  id="apellidoP"
                  name="apellidoP"
                  type="text"
                  placeholder="Apellido Paterno"
                  className={`Text-box ${invalido === 'apellidoP' ? 'campo-invalido' : ''}`}
                  value={form.apellidoP}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="apellidoM">Apellido Materno</label>
                <input
                  id="apellidoM"
                  name="apellidoM"
                  type="text"
                  placeholder="Apellido Materno"
                  className="Text-box"
                  value={form.apellidoM}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                <input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  className={`Text-box ${invalido === 'fechaNacimiento' ? 'campo-invalido' : ''}`}
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="sexo">Sexo</label>
                <select
                  id="sexo"
                  name="sexo"
                  className={`Text-box ${invalido === 'sexo' ? 'campo-invalido' : ''}`}
                  value={form.sexo}
                  onChange={handleChange}
                >
                  <option value="">Selecciona sexo...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="Campo">
                <label htmlFor="telefono">Número de teléfono</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="10 dígitos (ej. 8112345678)"
                  className={`Text-box ${invalido === 'telefono' ? 'campo-invalido' : ''}`}
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  placeholder="paciente@ejemplo.com (opcional)"
                  className="Text-box"
                  value={form.correo}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="tipoSangre">Tipo de sangre</label>
                <select
                  id="tipoSangre"
                  name="tipoSangre"
                  className="Text-box"
                  value={form.tipoSangre}
                  onChange={handleChange}
                >
                  <option value="">Desconocido / No sabe</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>

              <div className="Campo full-width">
                <label htmlFor="direccion">Dirección</label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  placeholder="Calle, número, colonia, municipio, CP"
                  className="Text-box"
                  value={form.direccion}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo full-width">
                <label htmlFor="alergias">Alergias conocidas</label>
                <input
                  id="alergias"
                  name="alergias"
                  type="text"
                  placeholder="Ninguna o separadas por comas (ej. Penicilina, AINEs)"
                  className="Text-box"
                  value={form.alergias}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="contactoNombre">Contacto de emergencia</label>
                <input
                  id="contactoNombre"
                  name="contactoNombre"
                  type="text"
                  placeholder="Nombre de familiar o tutor"
                  className="Text-box"
                  value={form.contactoNombre}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo">
                <label htmlFor="contactoParentesco">Parentesco</label>
                <input
                  id="contactoParentesco"
                  name="contactoParentesco"
                  type="text"
                  placeholder="ej. Cónyuge, Madre, Hermano"
                  className="Text-box"
                  value={form.contactoParentesco}
                  onChange={handleChange}
                />
              </div>

              <div className="Campo full-width">
                <label htmlFor="contactoTelefono">Teléfono de emergencia</label>
                <input
                  id="contactoTelefono"
                  name="contactoTelefono"
                  type="tel"
                  placeholder="Teléfono del contacto"
                  className="Text-box"
                  value={form.contactoTelefono}
                  onChange={handleChange}
                />
              </div>

              <div className="full-width" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="Btn_Login" style={{ flex: 1 }} disabled={cargando}>
                  {cargando ? '⏳ Guardando en BD...' : ' Guardar Paciente'}
                </button>
                <button
                  type="button"
                  className="Btn_Registrarse"
                  style={{ flex: 1 }}
                  onClick={() => navigate(registrado ? `/consulta/${registrado}` : '/consulta')}
                >
                  Regresar a Consulta
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>
                Paciente Registrado con Éxito
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
                Se ha generado el expediente clínico institucional número: <br />
                <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{registrado}</strong>
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="Btn_Login"
                  style={{ padding: '0.75rem 1.5rem' }}
                  onClick={() => navigate(`/paciente/agendar?expediente=${encodeURIComponent(registrado)}`)}
                >
                  📅 Agendar Cita para este Paciente
                </button>
                <button
                  type="button"
                  className="Btn_Login"
                  style={{ padding: '0.75rem 1.5rem' }}
                  onClick={() => navigate(registrado ? `/consulta/${registrado}` : '/consulta')}
                >
                  🎤 Iniciar Consulta Médica
                </button>
                <button
                  type="button"
                  className="Btn_Registrarse"
                  style={{ padding: '0.75rem 2rem' }}
                  onClick={() => {
                    setRegistrado(null);
                    setForm({
                      nombre: '', apellidoP: '', apellidoM: '', fechaNacimiento: '',
                      sexo: '', telefono: '', correo: '', tipoSangre: '', direccion: '',
                      alergias: '', contactoNombre: '', contactoParentesco: '', contactoTelefono: ''
                    });
                  }}
                >
                  + Registrar Otro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast.visible && (
        <div className={`toast-notification ${toast.tipo === 'error' ? 'toast-error' : ''}`}>
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}
