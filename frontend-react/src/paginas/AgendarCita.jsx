import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import { agendarCita, obtenerPacientes, obtenerDoctores } from '../api/api';

export default function AgendarCita() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pacientes y doctores cargados exclusivamente desde MongoDB Atlas
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [doctores, setDoctores] = useState([]);

  const [form, setForm] = useState({
    pacienteExpediente: '',
    nombre: '',
    telefono: '',
    correo: '',
    especialidad: 'Medicina General',
    doctor: '',
    fecha: '',
    hora: '09:00',
    duracionMinutos: 30,
    motivo: ''
  });

  const [confirmada, setConfirmada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorEmpalme, setErrorEmpalme] = useState(null);

  // Cargar lista de doctores reales exclusivamente desde MongoDB Atlas
  useEffect(() => {
    let activo = true;
    obtenerDoctores()
      .then(res => {
        if (activo && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setDoctores(res.data);
          setForm(prev => {
            const docActualValido = res.data.some(d => d.nombre === prev.doctor);
            if (!docActualValido) {
              const primerDoc = res.data[0];
              return {
                ...prev,
                doctor: primerDoc.nombre,
                especialidad: primerDoc.especialidad || 'Medicina General'
              };
            }
            return prev;
          });
        }
      })
      .catch(err => {
        console.error('Error cargando doctores desde MongoDB:', err);
      });

    return () => { activo = false; };
  }, []);

  // Cargar lista de pacientes exclusivamente desde MongoDB Atlas
  useEffect(() => {
    obtenerPacientes()
      .then(res => {
        if (res && res.success && Array.isArray(res.data)) {
          setPacientes(res.data);

          // Si viene un paciente por query params (ej. ?expediente=EXP-000001)
          const params = new URLSearchParams(location.search);
          const expParam = params.get('expediente');
          if (expParam) {
            const p = res.data.find(item => item.expediente === expParam);
            if (p) {
              setPacienteSeleccionado(p.expediente);
              setForm(prev => ({
                ...prev,
                pacienteExpediente: p.expediente,
                nombre: p.nombreCompleto || `${p.nombre || ''} ${p.apellidoP || ''}`.trim(),
                telefono: p.telefono || '',
                correo: p.correo || ''
              }));
            }
          }
        }
      })
      .catch(err => console.error('Error cargando pacientes en AgendarCita:', err));
  }, [location.search]);

  // Manejar cambio de paciente en el selector
  const handleSelectPaciente = (expediente) => {
    setPacienteSeleccionado(expediente);
    setErrorEmpalme(null);
    if (!expediente) {
      setForm(prev => ({
        ...prev,
        pacienteExpediente: '',
        nombre: '',
        telefono: '',
        correo: ''
      }));
      return;
    }
    const p = pacientes.find(item => item.expediente === expediente);
    if (p) {
      setForm(prev => ({
        ...prev,
        pacienteExpediente: p.expediente,
        nombre: p.nombreCompleto || `${p.nombre || ''} ${p.apellidoP || ''}`.trim(),
        telefono: p.telefono || '',
        correo: p.correo || ''
      }));
    }
  };

  // Al cambiar doctor, si el doctor tiene especialidad asignada, actualizarla automáticamente
  const handleDoctorChange = (doctorNombre) => {
    const docEncontrado = doctores.find(d => d.nombre === doctorNombre);
    setForm(prev => ({
      ...prev,
      doctor: doctorNombre,
      especialidad: docEncontrado?.especialidad || prev.especialidad
    }));
    setErrorEmpalme(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorEmpalme(null);

    if (!form.nombre || !form.telefono || !form.fecha || !form.hora || !form.doctor) {
      alert('Por favor completa el nombre del paciente, teléfono, fecha, hora y médico asignado.');
      return;
    }

    setCargando(true);
    try {
      const res = await agendarCita(form);
      if (res.success) {
        setConfirmada(true);
      } else {
        if (res.empalme) {
          setErrorEmpalme(res.message || 'Se empalma con otra cita agendada en ese mismo horario.');
        } else {
          alert(res.message || 'Error al agendar la cita.');
        }
      }
    } catch (err) {
      console.error('Error al agendar cita:', err);
      alert('Hubo un error de conexión al verificar y agendar la cita.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <NavTemporal />
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '580px' }}>
          <div className="auth-header">
            <div className="auth-logo-badge">📅</div>
            <h1>Agendar Cita Médica</h1>
            <p>Programa consultas para pacientes en MongoDB Atlas sin empalmes</p>
          </div>

          {!confirmada ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Alerta de empalme / solapamiento */}
              {errorEmpalme && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  color: '#991b1b',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.5
                }}>
                  <strong>⚠️ Conflicto de horario detectado:</strong>
                  <div>{errorEmpalme}</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: '#b91c1c' }}>
                    Por favor selecciona una hora diferente o ajusta la fecha.
                  </div>
                </div>
              )}

              {/* Selector de paciente registrado */}
              {pacientes.length > 0 && (
                <div className="form-group">
                  <label>Seleccionar Paciente Registrado de MongoDB</label>
                  <select
                    value={pacienteSeleccionado}
                    onChange={e => handleSelectPaciente(e.target.value)}
                  >
                    <option value="">-- Ingresar datos manualmente o nuevo paciente --</option>
                    {pacientes.map((p, idx) => (
                      <option key={`${p.expediente}-${idx}`} value={p.expediente}>
                        {p.expediente} · {p.nombreCompleto || `${p.nombre || ''} ${p.apellidoP || ''}`.trim()} ({p.telefono || 'Sin tel.'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Nombre Completo del Paciente</label>
                <input
                  type="text"
                  placeholder="Tu nombre y apellidos"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="tel"
                    placeholder="10 dígitos"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Médico Asignado (MongoDB)</label>
                  <select
                    value={form.doctor}
                    onChange={e => handleDoctorChange(e.target.value)}
                    required
                  >
                    {doctores.map((doc, idx) => (
                      <option key={`${doc.id || idx}`} value={doc.nombre}>
                        {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Especialidad / Servicio</label>
                  <select
                    value={form.especialidad}
                    onChange={e => setForm({ ...form, especialidad: e.target.value })}
                  >
                    <option>Medicina General</option>
                    <option>Cardiología</option>
                    <option>Neurología</option>
                    <option>Pediatría</option>
                    <option>Traumatología</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Fecha de la Cita</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => {
                      setForm({ ...form, fecha: e.target.value });
                      setErrorEmpalme(null);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora de la Cita</label>
                  <select
                    value={form.hora}
                    onChange={e => {
                      setForm({ ...form, hora: e.target.value });
                      setErrorEmpalme(null);
                    }}
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="17:30">05:30 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de la Cita (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente el motivo..."
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '0.5rem', width: '100%' }}
                disabled={cargando}
              >
                {cargando ? 'Verificando disponibilidad...' : 'Confirmar Solicitud de Cita'}
              </button>

              <div className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem' }}>
                <Link to="/dashboard">← Directorio de Pacientes</Link>
                <Link to="/login-paciente">Portal de Pacientes</Link>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#16a34a' }}>¡Cita Solicitada con Éxito!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Hemos registrado la cita para el paciente <strong>{form.nombre}</strong> el día <strong>{form.fecha}</strong> a las <strong>{form.hora}</strong> con el <strong>{form.doctor}</strong> ({form.especialidad}).
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setConfirmada(false);
                    setErrorEmpalme(null);
                  }}
                >
                  Agendar otra cita
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir al Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
