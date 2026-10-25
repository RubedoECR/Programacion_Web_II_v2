import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import HeaderClinico from '../componentes/HeaderClinico';
import { obtenerCitas } from '../api/api';
import '../App.css';

// Genera bloques de 30 minutos de 08:00 a 15:00 (turno matutino)
function generarBloques() {
  const bloques = [];
  for (let h = 8; h < 15; h++) {
    for (const m of ['00', '30']) {
      bloques.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  return bloques;
}

export default function Dashboard1() {
  const navigate = useNavigate();
  const bloques = generarBloques();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar citas reales exclusivamente desde MongoDB Atlas
  useEffect(() => {
    let activo = true;
    obtenerCitas()
      .then(res => {
        if (activo && res && res.success && Array.isArray(res.data)) {
          setCitas(res.data);
        }
      })
      .catch(err => console.error('Error obteniendo citas desde MongoDB:', err))
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, []);

  const irAConsulta = (cita) => {
    navigate(`/consulta/${cita.pacienteExpediente || cita.expediente || cita._id}`, {
      state: {
        cita: {
          id: cita._id,
          expediente: cita.pacienteExpediente || cita.expediente,
          paciente: cita.nombre || cita.paciente,
          hora: cita.hora,
          motivo: cita.motivo
        }
      }
    });
  };

  return (
    <div className="app-container">
      <NavTemporal />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">📅</span>
            <span>Agenda del Día (MongoDB Atlas)</span>
          </div>

          <p>
            {cargando
              ? 'Conectando y cargando citas en tiempo real desde MongoDB...'
              : 'Selecciona una cita agendada para iniciar o continuar la consulta médica.'}
          </p>

          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Paciente</th>
                  <th>Expediente</th>
                  <th>Motivo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {bloques.map(hora => {
                  const cita = citas.find(c => (c.hora || '').startsWith(hora));
                  const pacienteNombre = cita ? (cita.nombre || cita.paciente) : null;
                  const exp = cita ? (cita.pacienteExpediente || cita.expediente || '—') : '—';

                  return (
                    <tr key={hora}>
                      <td><strong>{hora}</strong></td>
                      <td>{cita ? pacienteNombre : <span style={{ opacity: 0.45 }}>Disponible</span>}</td>
                      <td>{cita ? <span className="expediente-badge">{exp}</span> : '—'}</td>
                      <td>{cita ? (cita.motivo || 'Consulta general') : '—'}</td>
                      <td>
                        {cita && (
                          <button type="button" className="btn-primary" onClick={() => irAConsulta(cita)}>
                            Ir a consulta
                          </button>
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
