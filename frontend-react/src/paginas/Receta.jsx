import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import HeaderClinico from '../componentes/HeaderClinico';
import { obtenerPacientes, obtenerConsultasPorPaciente } from '../api/api';
import '../App.css';

export default function Receta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recetaData, setRecetaData] = useState(() => {
    const recetasGuardadas = JSON.parse(sessionStorage.getItem('mv_recetas') || '{}');
    if (id && recetasGuardadas[id]) {
      return recetasGuardadas[id];
    }
    return null;
  });

  const [cargando, setCargando] = useState(!recetaData);
  const [toast, setToast] = useState({ visible: false, mensaje: '' });

  useEffect(() => {
    if (recetaData) return;

    let activo = true;
    setCargando(true);

    // Buscar en MongoDB Atlas
    obtenerPacientes().then(async resPacientes => {
      if (!activo) return;
      if (resPacientes && resPacientes.data && Array.isArray(resPacientes.data)) {
        const expBuscado = id ? (id.startsWith('EXP') ? id : `EXP-${String(id).padStart(6, '0')}`) : null;
        const p = resPacientes.data.find((item, idx) =>
          item.expediente === id ||
          item.expediente === expBuscado ||
          String(idx + 1) === String(id)
        ) || resPacientes.data[0];

        if (p) {
          try {
            const resConsultas = await obtenerConsultasPorPaciente(p.expediente);
            if (activo && resConsultas && resConsultas.data && resConsultas.data.length > 0) {
              const c = resConsultas.data[0];
              setRecetaData({
                id: c._id || id || '00001',
                medico: c.medico || 'Dr. Diego Leal',
                cedula: 'CED-8492018 · Medicina General',
                pacienteTexto: `${p.nombreCompleto || p.nombre} · ${p.expediente}`,
                tipoConsulta: c.tipoConsulta || 'Consulta general',
                categoria: c.categoria || 'General',
                severidad: c.severidad || 'Leve',
                fecha: c.fecha ? new Date(c.fecha).toISOString().split('T')[0] : '2026-10-24',
                hora: '10:00',
                presion: c.presion || '—',
                frecuencia: c.frecuencia || '—',
                temperatura: c.temperatura || '—',
                peso: c.peso || '—',
                sintomas: c.sintomas || '',
                diagnosticos: c.diagnosticos || [],
                medicamentos: c.medicamentos || [],
                alergias: c.alergias || p.alergias || [],
                notas: c.notas || ''
              });
            }
          } catch (e) {
            console.warn('Error cargando consulta de MongoDB para receta:', e);
          }
        }
      }
    }).finally(() => {
      if (activo) setCargando(false);
    });

    return () => { activo = false; };
  }, [id, recetaData]);

  const mostrarToast = (msg) => {
    setToast({ visible: true, mensaje: msg });
    setTimeout(() => setToast({ visible: false, mensaje: '' }), 2400);
  };

  const guardarCambios = () => {
    if (id && recetaData) {
      const recetasGuardadas = JSON.parse(sessionStorage.getItem('mv_recetas') || '{}');
      recetasGuardadas[id] = recetaData;
      sessionStorage.setItem('mv_recetas', JSON.stringify(recetasGuardadas));
    }
    mostrarToast('Cambios en la receta médica guardados correctamente.');
  };

  const handleTextoChange = (campo, valor) => {
    setRecetaData(prev => ({ ...prev, [campo]: valor }));
  };

  if (cargando) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Buscando datos de la receta en MongoDB Atlas...</p>
        </div>
      </div>
    );
  }

  if (!recetaData) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No se encontró receta en MongoDB</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Aún no se ha generado una receta médica para este registro. Inicia una consulta para prescribir medicamentos.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('/consulta/1')}>
            Ir a Registro de Consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavTemporal />
      <HeaderClinico />

      <div className="clinical-container receta-container">
        {/* Barra superior de acciones */}
        <div className="receta-toolbar no-print">
          <button
            type="button"
            className="btn-primary"
            onClick={guardarCambios}
          >
            💾 Guardar Cambios
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
            onClick={() => navigate('/consulta/1')}
          >
            ← Volver a Consulta
          </button>
        </div>

        {/* Hoja de Receta Médica Imprimible */}
        <div className="receta-hoja">
          <div className="receta-header">
            <div>
              <div className="receta-doctor-nombre">{recetaData.medico || 'Dr. Diego Leal'}</div>
              <div className="receta-doctor-detalle">{recetaData.cedula || 'Médico Cirujano · Céd. Prof. 8492018'}</div>
            </div>
            <div className="receta-folio">
              <div><strong>Folio:</strong> MV-{String(recetaData.id).slice(-5).padStart(5, '0')}</div>
              <div><strong>Fecha:</strong> {recetaData.fecha} · {recetaData.hora || ''}</div>
            </div>
          </div>

          <hr className="receta-divider" />

          <div className="receta-paciente">
            <div>
              <span className="receta-label">Paciente: </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('pacienteTexto', e.target.innerText)}
              >
                {recetaData.pacienteTexto}
              </span>
            </div>
            <div>
              <span className="receta-label">Tipo de consulta: </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('tipoConsulta', e.target.innerText)}
              >
                {recetaData.tipoConsulta}
              </span>
            </div>
            <div>
              <span className="receta-label">Categoría: </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('categoria', e.target.innerText)}
              >
                {recetaData.categoria}
              </span>
            </div>
            <div>
              <span className="receta-label">Severidad: </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('severidad', e.target.innerText)}
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
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('presion', e.target.innerText)}
              >
                {recetaData.presion} mmHg
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Frecuencia</div>
              <div
                className="receta-vitals-val"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('frecuencia', e.target.innerText)}
              >
                {recetaData.frecuencia} lpm
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Temperatura</div>
              <div
                className="receta-vitals-val"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('temperatura', e.target.innerText)}
              >
                {recetaData.temperatura} °C
              </div>
            </div>
            <div>
              <div className="receta-vitals-label">Peso</div>
              <div
                className="receta-vitals-val"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextoChange('peso', e.target.innerText)}
              >
                {recetaData.peso} kg
              </div>
            </div>
          </div>

          <div className="receta-seccion-titulo">Diagnóstico Clínico</div>
          <div
            className="receta-seccion-contenido"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextoChange('diagnosticos', [e.target.innerText])}
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
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleTextoChange('alergias', [e.target.innerText])}
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
