// Portal del paciente: agendar una cita eligiendo médico, día y un horario disponible.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerDoctores } from '../../api/doctores.api';
import { obtenerDisponibles, agendarCita } from '../../api/citas.api';
import { hoyISO, nombreMedico } from '../../utils/formato';
import '../../estilos/App.css';

export default function AgendarCita() {
  const navigate = useNavigate();
  const [doctores, setDoctores] = useState([]);
  const [medico, setMedico] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [buscando, setBuscando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [citaAgendada, setCitaAgendada] = useState(null);

  // Lista de médicos
  useEffect(() => {
    obtenerDoctores().then((respuesta) => {
      if (respuesta.success) {
        setDoctores(respuesta.data);
        if (respuesta.data.length > 0) setMedico(respuesta.data[0]._id);
      }
    });
  }, []);

  // Cada vez que cambia el médico o el día, se piden los horarios libres
  useEffect(() => {
    if (medico === '' || fecha === '') return;
    let vigente = true;
    obtenerDisponibles(medico, fecha).then((respuesta) => {
      if (!vigente) return;
      setBuscando(false);
      if (respuesta.success) {
        setHorarios(respuesta.data);
        setError('');
      } else {
        setHorarios([]);
        setError(respuesta.message);
      }
    });
    return () => {
      vigente = false;
    };
  }, [medico, fecha]);

  function cambiarMedico(valor) {
    setMedico(valor);
    setHora('');
    setBuscando(true);
  }

  function cambiarFecha(valor) {
    setFecha(valor);
    setHora('');
    setBuscando(true);
  }

  async function confirmar() {
    if (hora === '') {
      setError('Elige un horario.');
      return;
    }
    setGuardando(true);
    const respuesta = await agendarCita({ medico, fecha, hora, motivo });
    setGuardando(false);

    if (respuesta.success) {
      setCitaAgendada(respuesta.data);
    } else {
      setError(respuesta.message);
      // El horario pudo haberse ocupado mientras tanto: se vuelve a consultar
      cambiarFecha(fecha);
    }
  }

  const doctorElegido = doctores.find((d) => d._id === medico);

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container" style={{ maxWidth: '760px' }}>
        <div className="clinical-card">
          {citaAgendada ? (
            <div style={{ textAlign: 'center' }}>
              <h2>✅ ¡Cita agendada!</h2>
              <p>
                {nombreMedico(doctorElegido)} te espera el <strong>{citaAgendada.fecha}</strong> a las{' '}
                <strong>{citaAgendada.hora}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button type="button" className="btn-primary" onClick={() => navigate('/portal/mis-citas')}>
                  Ver mis citas
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCitaAgendada(null);
                    setMotivo('');
                    cambiarFecha(fecha);
                  }}
                >
                  Agendar otra
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-title">
                <span className="icon">⏰</span>
                <span>Agendar una cita</span>
              </div>

              <div className="fila-formulario">
                <div className="form-group">
                  <label htmlFor="medico">Médico</label>
                  <select id="medico" value={medico} onChange={(e) => cambiarMedico(e.target.value)}>
                    {doctores.map((d) => (
                      <option key={d._id} value={d._id}>
                        {nombreMedico(d)} · {d.especialidad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="fecha">Día</label>
                  <input id="fecha" type="date" min={hoyISO()} value={fecha} onChange={(e) => cambiarFecha(e.target.value)} />
                </div>
              </div>

              <label><strong>Horarios disponibles</strong></label>
              {buscando && <p>Buscando horarios...</p>}
              {!buscando && horarios.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>No hay horarios libres ese día. Prueba con otra fecha.</p>
              )}
              <div className="horarios-grid">
                {horarios.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={'horario-btn' + (h === hora ? ' seleccionado' : '')}
                    onClick={() => setHora(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="motivo">Motivo de la consulta (opcional)</label>
                <input
                  id="motivo"
                  maxLength={300}
                  placeholder="Ej. dolor de garganta, revisión general..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              {error && <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

              <button type="button" className="btn-primary" disabled={guardando || hora === ''} onClick={confirmar}>
                {guardando ? 'Agendando...' : hora ? 'Confirmar cita a las ' + hora : 'Elige un horario'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
