// Catálogo de medicamentos: agregar, editar, activar/desactivar y eliminar.
import { useState, useEffect } from 'react';
import Navbar from '../../componentes/Navbar';
import HeaderClinico from '../../componentes/HeaderClinico';
import {
  obtenerMedicamentos,
  crearMedicamento,
  actualizarMedicamento,
  eliminarMedicamento,
} from '../../api/medicamentos.api';
import '../../estilos/App.css';

const VACIO = { nombre: '', presentacion: '', concentracion: '', via: 'Oral', dosisSugerida: '' };
const VIAS = ['Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Tópica', 'Inhalada', 'Otra'];

export default function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null); // null = agregando uno nuevo
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargar() {
    const respuesta = await obtenerMedicamentos();
    if (respuesta.success) setMedicamentos(respuesta.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  function avisar(respuesta) {
    if (respuesta.success) {
      setMensaje(respuesta.message);
      setError('');
      cargar();
    } else {
      setError(respuesta.message);
      setMensaje('');
    }
  }

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function editar(med) {
    setEditandoId(med._id);
    setForm({
      nombre: med.nombre,
      presentacion: med.presentacion,
      concentracion: med.concentracion,
      via: med.via,
      dosisSugerida: med.dosisSugerida,
    });
  }

  function limpiar() {
    setEditandoId(null);
    setForm(VACIO);
  }

  async function guardar(e) {
    e.preventDefault();
    if (form.nombre.trim() === '') {
      setError('El nombre es obligatorio.');
      return;
    }

    let respuesta;
    if (editandoId) {
      respuesta = await actualizarMedicamento(editandoId, form);
    } else {
      respuesta = await crearMedicamento(form);
    }
    avisar(respuesta);
    if (respuesta.success) limpiar();
  }

  async function cambiarActivo(med) {
    avisar(await actualizarMedicamento(med._id, { activo: !med.activo }));
  }

  async function eliminar(med) {
    if (!window.confirm('¿Eliminar ' + med.nombre + ' del catálogo?')) return;
    avisar(await eliminarMedicamento(med._id));
  }

  return (
    <div className="app-container">
      <Navbar />
      <HeaderClinico />

      <div className="clinical-container">
        <div className="clinical-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">
            <span className="icon">💊</span>
            <span>{editandoId ? 'Editar medicamento' : 'Agregar medicamento al catálogo'}</span>
          </div>

          <form onSubmit={guardar}>
            <div className="fila-formulario">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input id="nombre" name="nombre" value={form.nombre} onChange={cambiar} />
              </div>
              <div className="form-group">
                <label htmlFor="presentacion">Presentación</label>
                <input id="presentacion" name="presentacion" placeholder="Tabletas, jarabe..." value={form.presentacion} onChange={cambiar} />
              </div>
              <div className="form-group">
                <label htmlFor="concentracion">Concentración</label>
                <input id="concentracion" name="concentracion" placeholder="500 mg" value={form.concentracion} onChange={cambiar} />
              </div>
            </div>
            <div className="fila-formulario">
              <div className="form-group">
                <label htmlFor="via">Vía</label>
                <select id="via" name="via" value={form.via} onChange={cambiar}>
                  {VIAS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="dosisSugerida">Dosis sugerida</label>
                <input id="dosisSugerida" name="dosisSugerida" value={form.dosisSugerida} onChange={cambiar} />
              </div>
              <button type="submit" className="btn-primary">{editandoId ? 'Guardar cambios' : 'Agregar'}</button>
              {editandoId && (
                <button type="button" className="btn-secondary" onClick={limpiar}>Cancelar</button>
              )}
            </div>
          </form>

          {mensaje && <div className="alert-success">{mensaje}</div>}
          {error && <div className="alert-error">{error}</div>}
        </div>

        <div className="clinical-card">
          <div className="card-title">
            <span className="icon">📋</span>
            <span>Catálogo ({medicamentos.length})</span>
          </div>
          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Presentación</th>
                  <th>Vía</th>
                  <th>Dosis sugerida</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map((med) => (
                  <tr key={med._id} style={{ opacity: med.activo ? 1 : 0.55 }}>
                    <td><strong>{med.nombre}</strong></td>
                    <td>{med.presentacion} {med.concentracion}</td>
                    <td>{med.via}</td>
                    <td>{med.dosisSugerida || '—'}</td>
                    <td>{med.activo ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <button type="button" className="btn-secondary btn-chico" onClick={() => editar(med)}>Editar</button>
                      <button type="button" className="btn-secondary btn-chico" onClick={() => cambiarActivo(med)}>
                        {med.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button type="button" className="btn-danger btn-chico" onClick={() => eliminar(med)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
