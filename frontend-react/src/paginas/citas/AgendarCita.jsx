import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import { agendarCita } from '../../api/citas.api';
import { obtenerPacientes } from '../../api/pacientes.api';
import { obtenerDoctores } from '../../api/doctores.api';
import { useAuth } from '../../context/useAuth';
import { nombreCompleto, nombreMedico, hoyISO } from '../../utils/formato';

export default function AgendarCita() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);

  const [form, setForm] = useState({
    paciente: '',          // _id del paciente registrado ('' = captura manual)
    nombre: '',
    telefono: '',
    correo: '',
    especialidad: usuario.especialidad || 'Medicina General',
    medico: usuario._id,   // por defecto, el médico en sesión
    fecha: '',
    hora: '09:00',
    duracionMinutos: 30,
    motivo: ''
  });

  const [confirmada, setConfirmada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorEmpalme, setErrorEmpalme] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerDoctores().then(res => {
      if (res.success) setDoctores(res.data);
    });
  }, []);

  // Pacientes activos; si viene ?expediente=EXP-000001 se preselecciona
  useEffect(() => {
    obtenerPacientes({ estado: 'Activo' }).then(res => {
      if (!res.success) return;
      setPacientes(res.data);
      const expParam = new URLSearchParams(location.search).get('expediente');
      const p = expParam && res.data.find(item => item.expediente === expParam);
      if (p) aplicarPaciente(p);
    });
  }, [location.search]);

  function aplicarPaciente(p) {
    setForm(prev => ({
      ...prev,
      paciente: p._id,
      nombre: nombreCompleto(p),
      telefono: p.telefono || '',
      correo: p.correo || ''
    }));
  }

  const handleSelectPaciente = (id) => {
    setErrorEmpalme(null);
    const p = pacientes.find(item => item._id === id);
    if (p) aplicarPaciente(p);
    else setForm(prev => ({ ...prev, paciente: '', nombre: '', telefono: '', correo: '' }));
  };

  // Al cambiar de médico se toma su especialidad
  const handleDoctorChange = (id) => {
    const doc = doctores.find(d => d._id === id);
    setForm(prev => ({ ...prev, medico: id, especialidad: doc?.especialidad || prev.especialidad }));
    setErrorEmpalme(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorEmpalme(null);
    setError('');

    if (!form.nombre.trim() || !form.telefono.trim() || !form.fecha || !form.hora || !form.medico) {
      setError('Completa el nombre del paciente, teléfono, fecha, hora y médico asignado.');
      return;
    }
    if (form.telefono.replace(/\D/g, '').length < 10) {
      setError('El teléfono debe tener al menos 10 dígitos.');
      return;
    }
    if (form.fecha < hoyISO()) {
      setError('No se pueden agendar citas en fechas pasadas.');
      return;
    }

    setCargando(true);
    const res = await agendarCita(form);
    setCargando(false);

    if (res.success) setConfirmada(true);
    else if (res.empalme) setErrorEmpalme(res.message);
    else setError(res.message || 'Error al agendar la cita.');
  };

  const medicoElegido = doctores.find(d => d._id === form.medico);

  return (
    <>
      <Navbar />
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
              {error && <div className="alert-error">{error}</div>}

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
                  <label>Seleccionar Paciente Registrado</label>
                  <select
                    value={form.paciente}
                    onChange={e => handleSelectPaciente(e.target.value)}
                  >
                    <option value="">-- Ingresar datos manualmente o nuevo paciente --</option>
                    {pacientes.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.expediente} · {nombreCompleto(p)} ({p.telefono || 'Sin tel.'})
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
                  <label>Médico Asignado</label>
                  <select
                    value={form.medico}
                    onChange={e => handleDoctorChange(e.target.value)}
                    required
                  >
                    {doctores.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        {nombreMedico(doc)} {doc.especialidad ? `(${doc.especialidad})` : ''}
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
                    min={hoyISO()}
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
                <Link to="/dashboard">← Agenda</Link>
                <Link to="/pacientes">Directorio de Pacientes</Link>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#16a34a' }}>¡Cita Solicitada con Éxito!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Hemos registrado la cita para el paciente <strong>{form.nombre}</strong> el día <strong>{form.fecha}</strong> a las <strong>{form.hora}</strong> con el <strong>{nombreMedico(medicoElegido)}</strong> ({form.especialidad}).
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
                  Ir a la Agenda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
