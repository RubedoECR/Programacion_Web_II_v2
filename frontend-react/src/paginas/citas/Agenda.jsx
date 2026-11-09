// Agenda del médico en sesión: bloques de 30 min con sus citas del día elegido.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerCitas } from '../../api/citas.api';
import { useAuth } from '../../context/useAuth';
import { hoyISO } from '../../utils/formato';
import '../../estilos/App.css';

// Bloques de 30 minutos de 08:00 a 15:00 (turno matutino)
function generarBloques() {
  const bloques = [];
  for (let h = 8; h < 15; h++) {
    for (const m of ['00', '30']) bloques.push(`${String(h).padStart(2, '0')}:${m}`);
  }
  return bloques;
}
const BLOQUES = generarBloques();

export default function Agenda() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState(hoyISO());
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerCitas({ fecha, medico: usuario._id }).then((res) => {
      if (!activo) return;
      if (res.success) {
        setCitas(res.data);
        setError('');
      } else {
        setError(res.message);
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [fecha, usuario._id]);

  const cambiarFecha = (valor) => {
    setCargando(true);
    setFecha(valor);
  };

  // Citas fuera del horario de bloques (ej. 16:00) también se muestran al final
  const citasFueraDeBloque = citas.filter((c) => c.hora < BLOQUES[0] || c.hora >= sumar30(BLOQUES[BLOQUES.length - 1]));

  const irAConsulta = (cita) => {
    navigate(`/consulta/${cita.paciente.expediente}`, {
      state: { cita: { id: cita._id, motivo: cita.motivo, hora: cita.hora } },
    });
  };

  const filaCita = (hora, cita) => (
    <tr key={cita ? cita._id : hora}>
      <td><strong>{cita ? cita.hora : hora}</strong></td>
      <td>{cita ? cita.nombre : <span style={{ opacity: 0.45 }}>Disponible</span>}</td>
      <td>{cita?.paciente ? <span className="expediente-badge">{cita.paciente.expediente}</span> : '—'}</td>
      <td>{cita ? cita.motivo || 'Consulta general' : '—'}</td>
      <td>{cita ? cita.estado : '—'}</td>
      <td>
        {cita && cita.estado === 'Confirmada' && cita.paciente && (
          <button type="button" className="btn-primary" onClick={() => irAConsulta(cita)}>
            Ir a consulta
          </button>
        )}
        {cita && cita.estado === 'Confirmada' && !cita.paciente && (
          <button type="button" className="btn-secondary" onClick={() => navigate('/paciente/nuevo')}>
            Registrar paciente
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">📅</span>
            <span>Agenda de {usuario.nombre} {usuario.apellidoP}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <label htmlFor="fechaAgenda"><strong>Día:</strong></label>
            <input id="fechaAgenda" type="date" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={() => cambiarFecha(hoyISO())}>Hoy</button>
            <span style={{ color: 'var(--text-muted)' }}>
              {cargando ? 'Cargando citas...' : `${citas.length} cita(s) programada(s)`}
            </span>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Paciente</th>
                  <th>Expediente</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {BLOQUES.map((bloque) => {
                  const delBloque = citas.filter((c) => c.hora >= bloque && c.hora < sumar30(bloque));
                  return delBloque.length ? delBloque.map((c) => filaCita(bloque, c)) : filaCita(bloque, null);
                })}
                {citasFueraDeBloque.map((c) => filaCita(c.hora, c))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function sumar30(hora) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
