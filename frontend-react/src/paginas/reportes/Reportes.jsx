// Vista de Reportes: usa solo las 6 funciones de src/api/reportes.api.js.
// El backend ya calcula los reportes; esta página solo los muestra.
// No se tocó backend ni se agregaron librerías.
import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import {
  obtenerResumen,
  reporteConsultasPorMedico,
  reporteAsistenciaCitas,
  reporteDiagnosticos,
  reporteMedicamentos,
  reportePacientesFrecuentes,
} from '../../api/reportes.api';
import '../../estilos/App.css';

// Fecha local en formato AAAA-MM-DD (sin depender de la zona horaria UTC).
function aFechaISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function primerDiaDelMes() {
  const hoy = new Date();
  return aFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

// El backend responde { success, data }; data es un objeto (resumen)
// o un arreglo (los 5 reportes con rango). Si algo viene distinto,
// se trata como vacío en vez de romper la página.
function comoArreglo(dato) {
  if (Array.isArray(dato)) return dato;
  if (dato && Array.isArray(dato.data)) return dato.data;
  return [];
}

export default function Reportes() {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(aFechaISO(new Date()));
  const [errorRango, setErrorRango] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [resumen, setResumen] = useState(null);
  const [porMedico, setPorMedico] = useState([]);
  const [asistencia, setAsistencia] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  // Campos exactos del backend (backend/src/controllers/reportes.controller.js):
  // resumen: { pacientesActivos, citasHoy, consultasMes, consultasMesPropias }
  // consultas-por-medico: [{ medico, especialidad, totalConsultas, pacientesAtendidos, casosGraves }]
  // asistencia-citas: [{ medico, total, confirmadas, atendidas, canceladas, porcentajeAsistencia (null si no hay atendidas+canceladas) }]
  // diagnosticos-frecuentes: [{ diagnostico, veces, pacientesDistintos, mujeres, hombres }]
  // medicamentos-mas-recetados: [{ nombre, veces, pacientesDistintos, enCatalogo, presentacion }]
  // pacientes-frecuentes: [{ nombre, expediente, consultas, ultimaVisita }]
  // Los accesos con ?? son solo defensivos por si un campo viene vacío;
  // TODO: verificar en la demo en la Dell que cada tabla se llena con datos reales.
  const cargarResumen = useCallback(async () => {
    const res = await obtenerResumen();
    if (res.success) {
      setResumen(res.data?.resumen ?? res.data ?? null);
    } else {
      setError(res.message || 'No se pudo cargar el resumen.');
    }
  }, []);

  const cargarReportes = useCallback(async (rango) => {
    setCargando(true);
    setError('');
    const [rMedico, rAsistencia, rDiag, rMed, rPac] = await Promise.all([
      reporteConsultasPorMedico(rango),
      reporteAsistenciaCitas(rango),
      reporteDiagnosticos(rango),
      reporteMedicamentos(rango),
      reportePacientesFrecuentes(rango),
    ]);
    const fallida = [rMedico, rAsistencia, rDiag, rMed, rPac].find((r) => !r.success);
    if (fallida) {
      setError(fallida.message || 'No se pudieron cargar los reportes.');
    }
    setPorMedico(comoArreglo(rMedico?.data));
    setAsistencia(comoArreglo(rAsistencia?.data));
    setDiagnosticos(comoArreglo(rDiag?.data));
    setMedicamentos(comoArreglo(rMed?.data));
    setPacientes(comoArreglo(rPac?.data));
    setCargando(false);
  }, []);

  // Al montar: el resumen (sin rango, el backend lo ignora) y los 5 reportes
  // con el rango por defecto (primer día del mes a hoy).
  useEffect(() => {
    let activo = true;
    (async () => {
      await cargarResumen();
      if (!activo) return;
      await cargarReportes({ desde: primerDiaDelMes(), hasta: aFechaISO(new Date()) });
    })();
    return () => { activo = false; };
  }, [cargarResumen, cargarReportes]);

  const aplicarFiltro = (e) => {
    e.preventDefault();
    if (desde && hasta && desde > hasta) {
      setErrorRango('La fecha "desde" no puede ser mayor que la fecha "hasta".');
      return;
    }
    setErrorRango('');
    cargarReportes({ desde, hasta });
  };

  const tarjetas = [
    { titulo: 'Pacientes activos', valor: resumen?.pacientesActivos ?? '—' },
    { titulo: 'Citas de hoy', valor: resumen?.citasHoy ?? '—' },
    { titulo: 'Consultas del mes', valor: resumen?.consultasMes ?? '—' },
    { titulo: 'Consultas propias del mes', valor: resumen?.consultasMesPropias ?? '—' },
  ];

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="page-layout">
          <main className="main-content" style={{ width: '100%' }}>
            <div className="clinical-card">
              <div className="card-title">
                <span className="icon">📊</span>
                <span>Reportes</span>
              </div>
              <p>
                Resumen general y reportes del periodo seleccionado. El resumen no depende
                del rango; las tablas sí.
              </p>

              <form onSubmit={aplicarFiltro} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'end' }}>
                <label>
                  Desde
                  <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                </label>
                <label>
                  Hasta
                  <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </label>
                <button type="submit" className="btn-primary">Aplicar</button>
              </form>
              {errorRango && <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{errorRango}</p>}
              {error && <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{error}</p>}
              {cargando && <p>Cargando reportes…</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginTop: '0.6rem' }}>
              {tarjetas.map((t) => (
                <div key={t.titulo} className="clinical-card" style={{ textAlign: 'center', marginTop: 0 }}>
                  <div className="card-title" style={{ justifyContent: 'center' }}>{t.titulo}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{t.valor}</div>
                </div>
              ))}
            </div>

            <div className="clinical-card records-section">
              <div className="card-title"><span className="icon">🩺</span><span>Consultas por médico</span></div>
              <div className="table-wrap">
                <table className="clinical-table">
                  <thead><tr><th>Médico</th><th>Especialidad</th><th>Consultas</th><th>Pacientes atendidos</th><th>Casos graves</th></tr></thead>
                  <tbody>
                    {porMedico.map((r, idx) => (
                      <tr key={r.medicoId || r.medico || idx}>
                        <td><strong>{r.medico ?? r.nombre ?? '—'}</strong></td>
                        <td>{r.especialidad ?? '—'}</td>
                        <td>{r.totalConsultas ?? r.total ?? 0}</td>
                        <td>{r.pacientesAtendidos ?? '—'}</td>
                        <td>{r.casosGraves ?? '—'}</td>
                      </tr>
                    ))}
                    {!porMedico.length && (
                      <tr><td colSpan={5} className="empty-state">{cargando ? 'Cargando reportes…' : 'Sin datos en este rango'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="clinical-card records-section">
              <div className="card-title"><span className="icon">📅</span><span>Asistencia de citas</span></div>
              <div className="table-wrap">
                <table className="clinical-table">
                  <thead><tr><th>Médico</th><th>Total</th><th>Confirmadas</th><th>Atendidas</th><th>Canceladas</th><th>% asistencia</th></tr></thead>
                  <tbody>
                    {asistencia.map((r, idx) => (
                      <tr key={r.medicoId || r.medico || idx}>
                        <td><strong>{r.medico ?? r.nombre ?? '—'}</strong></td>
                        <td>{r.total ?? 0}</td>
                        <td>{r.confirmadas ?? 0}</td>
                        <td>{r.atendidas ?? 0}</td>
                        <td>{r.canceladas ?? 0}</td>
                        <td>{r.porcentajeAsistencia === null || r.porcentajeAsistencia === undefined ? '—' : `${r.porcentajeAsistencia} %`}</td>
                      </tr>
                    ))}
                    {!asistencia.length && (
                      <tr><td colSpan={6} className="empty-state">{cargando ? 'Cargando reportes…' : 'Sin datos en este rango'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="clinical-card records-section">
              <div className="card-title"><span className="icon">🧾</span><span>Diagnósticos frecuentes</span></div>
              <div className="table-wrap">
                <table className="clinical-table">
                  <thead><tr><th>Diagnóstico</th><th>Veces</th><th>Mujeres</th><th>Hombres</th><th>Pacientes distintos</th></tr></thead>
                  <tbody>
                    {diagnosticos.map((r, idx) => (
                      <tr key={r.diagnostico || idx}>
                        <td><strong>{r.diagnostico ?? '—'}</strong></td>
                        <td>{r.veces ?? 0}</td>
                        <td>{r.mujeres ?? 0}</td>
                        <td>{r.hombres ?? 0}</td>
                        <td>{r.pacientesDistintos ?? '—'}</td>
                      </tr>
                    ))}
                    {!diagnosticos.length && (
                      <tr><td colSpan={5} className="empty-state">{cargando ? 'Cargando reportes…' : 'Sin datos en este rango'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="clinical-card records-section">
              <div className="card-title"><span className="icon">💊</span><span>Medicamentos más recetados</span></div>
              <div className="table-wrap">
                <table className="clinical-table">
                  <thead><tr><th>Medicamento</th><th>Veces</th><th>Pacientes distintos</th><th>Presentación</th></tr></thead>
                  <tbody>
                    {medicamentos.map((r, idx) => (
                      <tr key={r.nombre || idx}>
                        <td><strong>{r.nombre ?? '—'}</strong></td>
                        <td>{r.veces ?? 0}</td>
                        <td>{r.pacientesDistintos ?? '—'}</td>
                        <td>{r.presentacion ?? '—'}</td>
                      </tr>
                    ))}
                    {!medicamentos.length && (
                      <tr><td colSpan={4} className="empty-state">{cargando ? 'Cargando reportes…' : 'Sin datos en este rango'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="clinical-card records-section">
              <div className="card-title"><span className="icon">👥</span><span>Pacientes frecuentes</span></div>
              <div className="table-wrap">
                <table className="clinical-table">
                  <thead><tr><th>Paciente</th><th>Expediente</th><th>Consultas</th><th>Última visita</th></tr></thead>
                  <tbody>
                    {pacientes.map((r, idx) => (
                      <tr key={r.pacienteId || r.expediente || idx}>
                        <td><strong>{r.nombre ?? '—'}</strong></td>
                        <td>{r.expediente ?? '—'}</td>
                        <td>{r.consultas ?? 0}</td>
                        <td>{r.ultimaVisita ? String(r.ultimaVisita).slice(0, 10) : '—'}</td>
                      </tr>
                    ))}
                    {!pacientes.length && (
                      <tr><td colSpan={4} className="empty-state">{cargando ? 'Cargando reportes…' : 'Sin datos en este rango'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
