// Agenda del médico: sus citas del día con opciones para atender, reprogramar, cancelar o eliminar.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerCitas, obtenerDisponibles, reprogramarCita, cancelarCita, eliminarCita } from '../../api/citas.api';
import { useAuth } from '../../context/useAuth';
import { hoyISO, nombreCompleto } from '../../utils/formato';
import '../../estilos/App.css';

// Mismos horarios que el backend (backend/src/utils/horarios.js)
const HORARIOS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];

export default function Agenda() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState(hoyISO());
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Reprogramación: la cita que se está moviendo y su nueva fecha/hora
  const [moviendo, setMoviendo] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [libres, setLibres] = useState([]);

  async function cargarCitas(dia) {
    const respuesta = await obtenerCitas({ fecha: dia, medico: usuario._id });
    if (respuesta.success) setCitas(respuesta.data);
    else setError(respuesta.message);
    setCargando(false);
  }

  useEffect(() => {
    cargarCitas(fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  function cambiarDia(dia) {
    setCargando(true);
    setMoviendo(null);
    setFecha(dia);
  }

  function avisar(respuesta) {
    if (respuesta.success) {
      setMensaje(respuesta.message);
      setError('');
    } else {
      setError(respuesta.message);
      setMensaje('');
    }
    cargarCitas(fecha);
  }

  function atender(cita) {
    navigate('/consulta/' + cita.paciente.expediente, { state: { cita: { id: cita._id, motivo: cita.motivo } } });
  }

  async function cancelar(cita) {
    if (!window.confirm('¿Cancelar la cita de las ' + cita.hora + '?')) return;
    avisar(await cancelarCita(cita._id));
  }

  async function eliminar(cita) {
    if (!window.confirm('¿Eliminar definitivamente la cita de las ' + cita.hora + '?')) return;
    avisar(await eliminarCita(cita._id));
  }

  async function empezarAMover(cita) {
    setMoviendo(cita);
    setNuevaFecha(cita.fecha);
    setNuevaHora('');
    await buscarLibres(cita.fecha);
  }

  async function buscarLibres(dia) {
    setNuevaFecha(dia);
    setNuevaHora('');
    const respuesta = await obtenerDisponibles(usuario._id, dia);
    setLibres(respuesta.success ? respuesta.data : []);
  }

  async function guardarMovimiento() {
    if (nuevaHora === '') {
      setError('Elige la nueva hora.');
      return;
    }
    const respuesta = await reprogramarCita(moviendo._id, nuevaFecha, nuevaHora);
    if (respuesta.success) setMoviendo(null);
    avisar(respuesta);
  }

  // Busca la cita (no cancelada) de un horario; si no hay, regresa la cancelada si existe
  function citaDelHorario(hora) {
    const activa = citas.find((c) => c.hora === hora && c.estado !== 'Cancelada');
    if (activa) return activa;
    return citas.find((c) => c.hora === hora);
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">📅</span>
            <span>Agenda de Dr. {usuario.nombre} {usuario.apellidoP}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <label htmlFor="dia"><strong>Día:</strong></label>
            <input id="dia" type="date" value={fecha} onChange={(e) => cambiarDia(e.target.value)} style={{ width: "auto" }} />
            <button type="button" className="btn-secondary" onClick={() => cambiarDia(hoyISO())}>Hoy</button>
            <span style={{ color: 'var(--text-muted)' }}>
              {cargando ? 'Cargando...' : citas.filter((c) => c.estado === 'Confirmada').length + ' cita(s) por atender'}
            </span>
          </div>

          {mensaje && <div className="alert-success">{mensaje}</div>}
          {error && <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

          {moviendo && (
            <div className="clinical-card" style={{ background: '#f8fafc', marginBottom: '1rem' }}>
              <strong>Reprogramar cita de {nombreCompleto(moviendo.paciente)} ({moviendo.hora})</strong>
              <div className="fila-formulario" style={{ marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label htmlFor="nuevaFecha">Nuevo día</label>
                  <input id="nuevaFecha" type="date" min={hoyISO()} value={nuevaFecha} onChange={(e) => buscarLibres(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="nuevaHora">Nueva hora</label>
                  <select id="nuevaHora" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)}>
                    <option value="">{libres.length ? 'Elige...' : 'Sin horarios libres'}</option>
                    {libres.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="btn-primary" onClick={guardarMovimiento}>Guardar</button>
                <button type="button" className="btn-secondary" onClick={() => setMoviendo(null)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Expediente</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map((hora) => {
                  const cita = citaDelHorario(hora);
                  if (!cita) {
                    return (
                      <tr key={hora}>
                        <td><strong>{hora}</strong></td>
                        <td colSpan={5} style={{ opacity: 0.45 }}>Disponible</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={hora}>
                      <td><strong>{hora}</strong></td>
                      <td>{cita.paciente ? nombreCompleto(cita.paciente) : '—'}</td>
                      <td>{cita.paciente ? <span className="expediente-badge">{cita.paciente.expediente}</span> : '—'}</td>
                      <td>{cita.motivo || 'Consulta general'}</td>
                      <td>{cita.estado}</td>
                      <td>
                        {cita.estado === 'Confirmada' && cita.paciente && (
                          <>
                            <button type="button" className="btn-primary btn-chico" onClick={() => atender(cita)}>Atender</button>
                            <button type="button" className="btn-secondary btn-chico" onClick={() => empezarAMover(cita)}>Reprogramar</button>
                            <button type="button" className="btn-secondary btn-chico" onClick={() => cancelar(cita)}>Cancelar</button>
                          </>
                        )}
                        {cita.estado !== 'Atendida' && (
                          <button type="button" className="btn-danger btn-chico" onClick={() => eliminar(cita)}>Eliminar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
