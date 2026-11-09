import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerReceta, actualizarReceta } from '../../api/recetas.api';
import { fechaCorta, nombreCompleto, nombreMedico } from '../../utils/formato';
import '../../estilos/App.css';

// Receta del API (con médico, paciente y consulta) → datos que pinta la hoja
function adaptarReceta(r) {
  const c = r.consulta || {};
  const fecha = new Date(r.fecha);
  return {
    id: r._id,
    folio: r.folio,
    pacienteExpediente: r.paciente?.expediente,
    medico: nombreMedico(r.medico),
    cedula: `${r.medico?.especialidad || 'Medicina General'} · Céd. Prof. ${r.medico?.cedula || '—'}`,
    pacienteTexto: r.paciente ? `${nombreCompleto(r.paciente)} · ${r.paciente.expediente}` : '—',
    tipoConsulta: c.tipoConsulta || 'Consulta general',
    categoria: c.categoria || 'General',
    severidad: c.severidad || 'Leve',
    fecha: fechaCorta(r.fecha),
    hora: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    presion: c.presion || '—',
    frecuencia: c.frecuencia || '—',
    temperatura: c.temperatura || '—',
    peso: c.peso || '—',
    diagnosticos: c.diagnosticos || [],
    medicamentos: r.medicamentos || [],
    alergias: c.alergias || [],
    notas: r.indicaciones || c.notas || '',
  };
}

export default function Receta() {
  const { id } = useParams(); // _id de la receta en MongoDB
  const navigate = useNavigate();

  const [recetaData, setRecetaData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, mensaje: '' });

  useEffect(() => {
    let activo = true;
    obtenerReceta(id).then(res => {
      if (!activo) return;
      if (res.success) setRecetaData(adaptarReceta(res.data));
      else setError(res.message);
      setCargando(false);
    });
    return () => { activo = false; };
  }, [id]);

  const mostrarToast = (msg) => {
    setToast({ visible: true, mensaje: msg });
    setTimeout(() => setToast({ visible: false, mensaje: '' }), 2400);
  };

  // En la receta solo se editan las indicaciones; los datos clínicos vienen de la consulta
  const guardarCambios = async () => {
    const res = await actualizarReceta(id, { indicaciones: recetaData.notas });
    mostrarToast(res.success ? 'Indicaciones de la receta guardadas.' : res.message);
  };

  const handleTextoChange = (campo, valor) => {
    setRecetaData(prev => ({ ...prev, [campo]: valor }));
  };

  const volver = () => navigate(recetaData?.pacienteExpediente ? `/historial/${recetaData.pacienteExpediente}` : '/pacientes');

  if (cargando) {
    return (
      <div className="app-container">
        <Navbar />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (!recetaData) {
    return (
      <div className="app-container">
        <Navbar />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Receta no encontrada</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {error || 'No existe una receta con ese identificador.'}
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('/pacientes')}>
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

      <div className="clinical-container receta-container">
        {/* Barra superior de acciones */}
        <div className="receta-toolbar no-print">
          <button
            type="button"
            className="btn-primary"
            onClick={guardarCambios}
          >
            💾 Guardar Indicaciones
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', borderColor: 'var(--primary)' }}
            onClick={() => window.print()}
          >
            🖨️ Imprimir / Guardar como PDF
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={volver}
          >
            ← Volver al Historial
          </button>
        </div>

        {/* Hoja de Receta Médica Imprimible */}
        <div className="receta-hoja">
          <div className="receta-header">
            <div>
              <div className="receta-doctor-nombre">{recetaData.medico}</div>
              <div className="receta-doctor-detalle">{recetaData.cedula}</div>
            </div>
            <div className="receta-folio">
              <div><strong>Folio:</strong> {recetaData.folio}</div>
              <div><strong>Fecha:</strong> {recetaData.fecha} · {recetaData.hora || ''}</div>
            </div>
          </div>

          <hr className="receta-divider" />

          <div className="receta-paciente">
            <div>
              <span className="receta-label">Paciente: </span>
              <span
              >
                {recetaData.pacienteTexto}
              </span>
            </div>
            <div>
              <span className="receta-label">Tipo de consulta: </span>
              <span
              >
                {recetaData.tipoConsulta}
              </span>
            </div>
            <div>
              <span className="receta-label">Categoría: </span>
              <span
              >
                {recetaData.categoria}
              </span>
            </div>
            <div>
              <span className="receta-label">Severidad: </span>
              <span
              >
                {recetaData.severidad}
              </span>
            </div>
          </div>

          {/* Signos Vitales */}
          <div className="receta-vitals">
            <div>
              <div className="receta-vitals-label">Presión</div>
              <div
                className="receta-vitals-val"
              >
                {recetaData.presion} mmHg
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Frecuencia</div>
              <div
                className="receta-vitals-val"
              >
                {recetaData.frecuencia} lpm
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Temperatura</div>
              <div
                className="receta-vitals-val"
              >
                {recetaData.temperatura} °C
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Peso</div>
              <div
                className="receta-vitals-val"
              >
                {recetaData.peso} kg
              </div>
            </div>
          </div>

          <div className="receta-seccion-titulo">Diagnóstico Clínico</div>
          <div
            className="receta-seccion-contenido"
          >
            {(recetaData.diagnosticos || []).join('; ') || 'Diagnóstico pendiente'}
          </div>

          <div className="receta-seccion-titulo">Tratamiento y Prescripción Médica (Rx)</div>
          <div className="receta-rx-box">
            {(recetaData.medicamentos || []).map((m, idx) => (
              <div key={idx} className="receta-med-item">
                <span className="receta-med-nombre">{idx + 1}. {m.nombre}</span>
                <span className="receta-med-dosis"> — {m.dosis}</span>
              </div>
            ))}
            {!(recetaData.medicamentos || []).length && (
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Sin medicamentos prescritos</div>
            )}
          </div>

          <div className="receta-seccion-titulo">Alergias Documentadas</div>
          <div
            className="receta-seccion-contenido"
          >
            {(recetaData.alergias || []).join(', ') || 'Sin alergias conocidas'}
          </div>

          <div className="receta-seccion-titulo">Indicaciones y Cuidados Generales</div>
          <div
            className="receta-seccion-contenido"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextoChange('notas', e.target.innerText)}
          >
            {recetaData.notas || 'Sin indicaciones adicionales registradas.'}
          </div>

          <div className="receta-footer">
            <div className="receta-firma-linea"></div>
            <div className="receta-firma-nombre">{recetaData.medico}</div>
            <div className="receta-firma-cedula">Firma y Sello del Médico Responsable</div>
          </div>
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
