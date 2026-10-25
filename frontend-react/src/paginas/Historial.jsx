import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import HeaderClinico from '../componentes/HeaderClinico';
import { obtenerPacientes, obtenerConsultasPorPaciente } from '../api/api';
import '../App.css';

export default function Historial() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ visible: false, mensaje: '' });

  useEffect(() => {
    let activo = true;
    setCargando(true);

    obtenerPacientes()
      .then(async res => {
        if (!activo) return;
        if (res && res.data && Array.isArray(res.data)) {
          const expBuscado = id ? (id.startsWith('EXP') ? id : `EXP-${String(id).padStart(6, '0')}`) : null;
          const p = res.data.find((item, idx) =>
            item.expediente === id ||
            item.expediente === expBuscado ||
            String(idx + 1) === String(id) ||
            item._id === id
          ) || res.data[0];

          if (p) {
            let calcEdad = p.edad || '—';
            if (calcEdad === '—' && p.fechaNacimiento) {
              const nac = new Date(p.fechaNacimiento);
              const hoy = new Date();
              calcEdad = String(hoy.getFullYear() - nac.getFullYear());
            }

            const pacienteObj = {
              expediente: p.expediente,
              nombre: p.nombreCompleto || `${p.nombre || ''} ${p.apellidoP || ''} ${p.apellidoM || ''}`.trim(),
              estado: p.estado || 'Activo',
              fechaNacimiento: p.fechaNacimiento || '—',
              edad: calcEdad !== '—' ? `${calcEdad} años` : '—',
              sexo: p.sexo || 'Otro',
              telefono: p.telefono || '—',
              correo: p.correo || '—',
              direccion: p.direccion || '—',
              tipoSangre: p.tipoSangre || '—',
              alergias: Array.isArray(p.alergias) ? p.alergias : (p.alergias ? [p.alergias] : []),
              contactoEmergencia: p.contactoEmergencia
                ? `${p.contactoEmergencia.nombre || ''} (${p.contactoEmergencia.parentesco || ''}) ${p.contactoEmergencia.telefono || ''}`.trim()
                : '—',
            };
            setPaciente(pacienteObj);

            // Cargar consultas reales de este paciente desde MongoDB Atlas
            try {
              const resConsultas = await obtenerConsultasPorPaciente(p.expediente);
              if (activo && resConsultas && resConsultas.success && Array.isArray(resConsultas.data)) {
                setConsultas(resConsultas.data);
              }
            } catch (errConsultas) {
              console.warn('Error al obtener consultas de MongoDB:', errConsultas);
            }
          }
        }
      })
      .catch(err => console.error('Error cargando paciente desde MongoDB:', err))
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [id]);

  const mostrarToast = (msg) => {
    setToast({ visible: true, mensaje: msg });
    setTimeout(() => setToast({ visible: false, mensaje: '' }), 2400);
  };

  // Última consulta registrada en MongoDB para signos vitales
  const ultimaConsulta = consultas.length > 0 ? consultas[0] : null;

  // Diagnósticos acumulados en MongoDB
  const todosDiagnosticos = Array.from(new Set(consultas.flatMap(c => c.diagnosticos || [])));
  const todosMedicamentos = consultas.flatMap(c => c.medicamentos || []);

  if (cargando) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Conectando a MongoDB Atlas y cargando expediente clínico...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No se encontró el paciente en MongoDB Atlas</h2>
          <p style={{ color: 'var(--text-muted)' }}>No existe ningún expediente con el identificador solicitado.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
            Ir al Directorio de Pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavTemporal />
      <HeaderClinico />

      <div className="clinical-container">
        <Link to="/dashboard" className="back-link">
          ← Regresar al Directorio de Pacientes
        </Link>

        <div className="page-layout">
          {/* Sidebar Datos Reales del Paciente en MongoDB */}
          <aside className="sidebar">
            <div className="profile-photo-wrap">
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {paciente.nombre.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="sidebar-name">{paciente.nombre}</div>
            <div className="sidebar-role">{paciente.expediente}</div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span className={`status-pill ${paciente.estado === 'Activo' ? 'status-pill-active' : ''}`}>
                <span className="status-dot"></span>
                Paciente {paciente.estado} (MongoDB)
              </span>
            </div>

            <hr className="sidebar-divider" />

            <div className="info-row">
              <span className="info-label">Fecha de nacimiento</span>
              <span className="info-value">{paciente.fechaNacimiento}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Edad / Sexo</span>
              <span className="info-value">{paciente.edad} · {paciente.sexo}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Teléfono</span>
              <span className="info-value">{paciente.telefono}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Correo</span>
              <span className="info-value">{paciente.correo}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Dirección</span>
              <span className="info-value">{paciente.direccion}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Tipo de sangre</span>
              <span className="info-value">{paciente.tipoSangre}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Contacto de emergencia</span>
              <span className="info-value">{paciente.contactoEmergencia}</span>
            </div>

            <hr className="sidebar-divider" />

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginBottom: '0.6rem' }}
              onClick={() => navigate(`/consulta/${encodeURIComponent(paciente.expediente)}`, { state: { paciente } })}
            >
              🩺 Iniciar Consulta
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '0.6rem' }}
              onClick={() => navigate(`/paciente/agendar?expediente=${encodeURIComponent(paciente.expediente)}`)}
            >
              📅 Agendar Cita
            </button>
          </aside>

          {/* Contenido Principal: Historial Clínico desde MongoDB */}
          <main className="main-content">
            {/* Signos Vitales Última Consulta Registrada en MongoDB */}
            <div className="clinical-card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">
                <span className="icon">🩺</span>
                <span>Signos Vitales ({ultimaConsulta ? 'Última Consulta en MongoDB' : 'Sin registro aún'})</span>
              </div>

              {ultimaConsulta ? (
                <div className="vitals-grid">
                  <div className="vital-box">
                    <div className="vital-value">{ultimaConsulta.presion || '—'}</div>
                    <div className="vital-label">Presión arterial</div>
                  </div>
                  <div className="vital-box">
                    <div className="vital-value">{ultimaConsulta.frecuencia ? `${ultimaConsulta.frecuencia} lpm` : '—'}</div>
                    <div className="vital-label">Frec. cardíaca</div>
                  </div>
                  <div className="vital-box">
                    <div className="vital-value">{ultimaConsulta.temperatura ? `${ultimaConsulta.temperatura} °C` : '—'}</div>
                    <div className="vital-label">Temperatura</div>
                  </div>
                  <div className="vital-box">
                    <div className="vital-value">{ultimaConsulta.peso ? `${ultimaConsulta.peso} kg` : '—'}</div>
                    <div className="vital-label">Peso corporal</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Aún no hay signos vitales registrados en MongoDB para este paciente. Inicia una consulta para capturarlos.
                </div>
              )}
            </div>

            {/* Línea de Tiempo y Diagnósticos */}
            <div className="history-grid">
              {/* Línea de tiempo de consultas desde MongoDB Atlas */}
              <div className="clinical-card">
                <div className="card-title">
                  <span className="icon">🕒</span>
                  <span>Historial de Consultas ({consultas.length} en MongoDB)</span>
                </div>

                {consultas.length > 0 ? (
                  <div className="timeline">
                    {consultas.map((c, idx) => (
                      <div key={c._id || idx} className="timeline-item">
                        <div className="timeline-header">
                          <span className="timeline-date">
                            {c.fecha ? new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Fecha no especificada'}
                          </span>
                          <span className="timeline-type">{c.tipoConsulta || 'Consulta general'}</span>
                        </div>
                        <div className="timeline-title">
                          {(c.diagnosticos || []).join(', ') || 'Consulta de evaluación'}
                        </div>
                        <div className="timeline-text">
                          {c.sintomas || c.notas || 'Sin notas adicionales.'}
                        </div>
                        <div className="timeline-doctor">
                          Atendido por: {c.medico || 'Médico tratante'} · {c.severidad ? `Severidad: ${c.severidad}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No hay consultas cronológicas registradas en MongoDB para este paciente.
                  </div>
                )}
              </div>

              {/* Columna derecha: Diagnósticos, Medicamentos y Alergias Reales */}
              <div className="stack">
                <div className="clinical-card">
                  <div className="card-title" style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>
                    <span className="icon">🩺</span>
                    <span>Diagnósticos Documentados</span>
                  </div>
                  <div className="tag-list">
                    {todosDiagnosticos.length > 0 ? (
                      todosDiagnosticos.map((d, i) => (
                        <span key={i} className="tag tag-accent">{d}</span>
                      ))
                    ) : (
                      <span className="tag" style={{ opacity: 0.6 }}>Sin diagnósticos previos</span>
                    )}
                  </div>
                </div>

                <div className="clinical-card">
                  <div className="card-title" style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>
                    <span className="icon">💊</span>
                    <span>Medicamentos Prescritos</span>
                  </div>
                  <div className="tag-list">
                    {todosMedicamentos.length > 0 ? (
                      todosMedicamentos.map((m, i) => (
                        <span key={i} className="tag">{m.nombre} {m.dosis ? `· ${m.dosis}` : ''}</span>
                      ))
                    ) : (
                      <span className="tag" style={{ opacity: 0.6 }}>Sin medicamentos prescritos</span>
                    )}
                  </div>
                </div>

                <div className="clinical-card">
                  <div className="card-title" style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>
                    <span className="icon">⚠️</span>
                    <span>Alergias Documentadas en MongoDB</span>
                  </div>
                  <div className="tag-list">
                    {paciente.alergias && paciente.alergias.length > 0 && paciente.alergias[0] !== 'Ninguna' ? (
                      paciente.alergias.map((a, i) => (
                        <span key={i} className="tag tag-danger">{a}</span>
                      ))
                    ) : (
                      <span className="tag" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                        Sin alergias conocidas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {toast.visible && (
        <div className="toast-notification">
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}
