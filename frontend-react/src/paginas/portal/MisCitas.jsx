// Portal del paciente: lista de sus citas, con opción de cancelar las confirmadas.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerMisCitas, cancelarCita } from '../../api/citas.api';
import { nombreMedico } from '../../utils/formato';
import '../../estilos/App.css';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargar() {
    const respuesta = await obtenerMisCitas();
    if (respuesta.success) setCitas(respuesta.data);
    else setError(respuesta.message);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cancelar(cita) {
    if (!window.confirm('¿Cancelar tu cita del ' + cita.fecha + ' a las ' + cita.hora + '?')) return;

    const respuesta = await cancelarCita(cita._id);
    if (respuesta.success) {
      setMensaje('Cita cancelada.');
      setError('');
      cargar();
    } else {
      setError(respuesta.message);
    }
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">📋</span>
            <span>Mis citas</span>
          </div>

          {mensaje && <div className="alert-success">{mensaje}</div>}
          {error && <div className="alert-error">{error}</div>}
          {cargando && <p>Cargando...</p>}

          {!cargando && citas.length === 0 && (
            <p>
              Aún no tienes citas. <Link to="/portal/agendar">Agenda una aquí</Link>.
            </p>
          )}

          {citas.length > 0 && (
            <div className="table-wrap">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Médico</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map((cita) => (
                    <tr key={cita._id}>
                      <td>{cita.fecha}</td>
                      <td><strong>{cita.hora}</strong></td>
                      <td>{nombreMedico(cita.medico)}</td>
                      <td>{cita.motivo || '—'}</td>
                      <td>{cita.estado}</td>
                      <td>
                        {cita.estado === 'Confirmada' && (
                          <button type="button" className="btn-danger btn-chico" onClick={() => cancelar(cita)}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
