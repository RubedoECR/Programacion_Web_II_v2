import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerPaciente } from '../../api/pacientes.api';
import { obtenerConsultas } from '../../api/consultas.api';
import { obtenerRecetas } from '../../api/recetas.api';
import { adaptarPaciente, fechaCorta, nombreMedico } from '../../utils/formato';
import '../../estilos/App.css';

export default function Historial() {
  const { id } = useParams(); // _id o expediente
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    (async () => {
      // Se busca exactamente el paciente de la URL; si no existe se muestra "no encontrado"
      const res = await obtenerPaciente(id);
      if (!activo) return;
      if (!res.success) {
        setPaciente(null);
        setError(res.message);
        setCargando(false);
        return;
      }

      const p = adaptarPaciente(res.data);
      const contacto = p.contactoEmergencia;
      setPaciente({
        ...p,
        fechaNacimiento: fechaCorta(p.fechaNacimiento, { utc: true }),
        edad: p.edad !== '—' ? `${p.edad} años` : '—',
        correo: p.correo || '—',
        direccion: p.direccion || '—',
        contactoEmergencia: contacto?.nombre
          ? `${contacto.nombre} (${contacto.parentesco || ''}) ${contacto.telefono || ''}`.trim()
          : '—',
      });

      const [resConsultas, resRecetas] = await Promise.all([
        obtenerConsultas({ paciente: p._id }),
        obtenerRecetas({ paciente: p._id }),
      ]);
      if (!activo) return;
      if (resConsultas.success) setConsultas(resConsultas.data);
      if (resRecetas.success) setRecetas(resRecetas.data);
      setCargando(false);
    })();

    return () => { activo = false; };
  }, [id]);

  // Última consulta registrada en MongoDB para signos vitales
  const ultimaConsulta = consultas.length > 0 ? consultas[0] : null;

  // Diagnósticos acumulados en MongoDB
  const todosDiagnosticos = Array.from(new Set(consultas.flatMap(c => c.diagnosticos || [])));
  const todosMedicamentos = recetas.flatMap(r => r.medicamentos || []);

  if (cargando) {
    return (
      <div className="app-container">
        <Navbar />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando expediente clínico...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="app-container">
        <Navbar />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Paciente no encontrado</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error || 'No existe ningún expediente con el identificador solicitado.'}</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/pacientes')} style={{ marginTop: '1rem' }}>
            Ir al Directorio de Pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <Link to="/pacientes" className="back-link">
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
                Paciente {paciente.estado}
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
                <span>Signos Vitales ({ultimaConsulta ? 'Última Consulta' : 'Sin registro aún'})</span>
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
                  Aún no hay signos vitales registrados para este paciente. Inicia una consulta para capturarlos.
                </div>
              )}
            </div>

            {/* Línea de Tiempo y Diagnósticos */}
            <div className="history-grid">
              {/* Línea de tiempo de consultas desde MongoDB Atlas */}
              <div className="clinical-card">
                <div className="card-title">
                  <span className="icon">🕒</span>
                  <span>Historial de Consultas ({consultas.length})</span>
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
                          Atendido por: {nombreMedico(c.medico)} · {c.severidad ? `Severidad: ${c.severidad}` : ''}
                          {c.receta && (
                            <> · <Link to={`/receta/${c.receta._id}`}>Ver receta {c.receta.folio}</Link></>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No hay consultas cronológicas registradas para este paciente.
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
                    <span>Alergias Documentadas</span>
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
    </div>
  );
}
