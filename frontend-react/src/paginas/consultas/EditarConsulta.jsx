// El médico corrige los datos de una consulta ya guardada.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import { obtenerConsulta, actualizarConsulta } from '../../api/consultas.api';
import { nombreCompleto, fechaCorta } from '../../utils/formato';
import '../../estilos/App.css';

export default function EditarConsulta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerConsulta(id).then((respuesta) => {
      if (!respuesta.success) {
        setError(respuesta.message);
        return;
      }
      const c = respuesta.data;
      setConsulta(c);
      setForm({
        severidad: c.severidad || 'Leve',
        presion: c.presion || '',
        frecuencia: c.frecuencia || '',
        temperatura: c.temperatura || '',
        peso: c.peso || '',
        talla: c.talla || '',
        sintomas: c.sintomas || '',
        diagnosticos: (c.diagnosticos || []).join(', '),
        notas: c.notas || '',
      });
    });
  }, [id]);

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function guardar(e) {
    e.preventDefault();
    if (form.sintomas.trim() === '' && form.diagnosticos.trim() === '') {
      setError('Registra al menos los síntomas o un diagnóstico.');
      return;
    }

    const datos = { ...form };
    // "Gripe, Tos" → ["Gripe", "Tos"]
    datos.diagnosticos = form.diagnosticos.split(',').map((d) => d.trim()).filter((d) => d !== '');

    setGuardando(true);
    const respuesta = await actualizarConsulta(id, datos);
    setGuardando(false);

    if (respuesta.success) {
      navigate('/historial/' + consulta.paciente.expediente);
    } else {
      setError(respuesta.message);
    }
  }

  function campo(nombre, etiqueta, placeholder = '') {
    return (
      <div className="form-group">
        <label htmlFor={nombre}>{etiqueta}</label>
        <input id={nombre} name={nombre} placeholder={placeholder} value={form[nombre]} onChange={cambiar} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container" style={{ maxWidth: '820px' }}>
        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">✏️</span>
            <span>Editar consulta</span>
          </div>

          {error && <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
          {!form && !error && <p>Cargando consulta...</p>}

          {form && (
            <form onSubmit={guardar}>
              <p style={{ color: 'var(--text-muted)' }}>
                {nombreCompleto(consulta.paciente)} · {consulta.paciente.expediente} · {fechaCorta(consulta.fecha)}
              </p>

              <div className="fila-formulario">
                <div className="form-group">
                  <label htmlFor="severidad">Severidad</label>
                  <select id="severidad" name="severidad" value={form.severidad} onChange={cambiar}>
                    <option>Leve</option>
                    <option>Moderado</option>
                    <option>Grave</option>
                    <option>Crítico</option>
                  </select>
                </div>
                {campo('presion', 'Presión', '120/80')}
                {campo('frecuencia', 'Frec. cardiaca (lpm)')}
              </div>
              <div className="fila-formulario">
                {campo('temperatura', 'Temperatura (°C)')}
                {campo('peso', 'Peso (kg)')}
                {campo('talla', 'Talla (cm)')}
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="sintomas">Síntomas</label>
                <textarea id="sintomas" name="sintomas" rows={3} value={form.sintomas} onChange={cambiar} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="diagnosticos">Diagnósticos (separados por coma)</label>
                <input id="diagnosticos" name="diagnosticos" value={form.diagnosticos} onChange={cambiar} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="notas">Notas</label>
                <textarea id="notas" name="notas" rows={3} value={form.notas} onChange={cambiar} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
