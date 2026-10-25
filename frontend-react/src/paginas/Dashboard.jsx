import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import { obtenerPacientes } from '../api/api';
import HeaderClinico from '../componentes/HeaderClinico';
import doctorAvatar from '../assets/doctor-avatar.jpg';
import '../App.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Pacientes cargados exclusivamente desde MongoDB Atlas
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    obtenerPacientes()
      .then(res => {
        if (activo && res && res.success && Array.isArray(res.data)) {
          const map = new Map();
          res.data.forEach(p => {
            if (p.expediente && !map.has(p.expediente)) {
              const nombreCompleto = p.nombreCompleto || `${p.nombre || ''} ${p.apellidoP || ''} ${p.apellidoM || ''}`.trim();
              let calcEdad = p.edad || '—';
              if (calcEdad === '—' && p.fechaNacimiento) {
                const nac = new Date(p.fechaNacimiento);
                const hoy = new Date();
                calcEdad = String(hoy.getFullYear() - nac.getFullYear());
              }
              map.set(p.expediente, {
                expediente: p.expediente,
                nombre: nombreCompleto,
                edad: calcEdad !== '—' ? `${calcEdad} años` : '—',
                telefono: p.telefono || '—',
                correo: p.correo || '',
                estado: p.estado || 'Activo',
                ultimaVisita: p.ultimaVisita || (p.fechaRegistro ? new Date(p.fechaRegistro).toISOString().split('T')[0] : '—'),
                sexo: p.sexo || 'Otro',
                alergias: p.alergias || []
              });
            }
          });
          const lista = Array.from(map.values());
          setPacientes(lista);
          sessionStorage.setItem('mv_pacientes', JSON.stringify(lista));
        }
      })
      .catch(err => console.error('Error cargando pacientes de MongoDB:', err))
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroSexo, setFiltroSexo] = useState('Todos');
  const [filtroEdad, setFiltroEdad] = useState('Todos');
  const [orden, setOrden] = useState('reciente');

  // Filtrado reactivo de pacientes de MongoDB
  const pacientesFiltrados = pacientes.filter(p => {
    const matchTexto =
      (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.expediente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.telefono || '').includes(busqueda);

    const matchEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    const matchSexo = filtroSexo === 'Todos' || p.sexo === filtroSexo;

    let matchEdad = true;
    const edadNum = parseInt(p.edad, 10);
    if (!isNaN(edadNum)) {
      if (filtroEdad === '0-12') matchEdad = edadNum <= 12;
      else if (filtroEdad === '13-17') matchEdad = edadNum >= 13 && edadNum <= 17;
      else if (filtroEdad === '18-40') matchEdad = edadNum >= 18 && edadNum <= 40;
      else if (filtroEdad === '41-65') matchEdad = edadNum >= 41 && edadNum <= 65;
      else if (filtroEdad === '65+') matchEdad = edadNum > 65;
    }

    return matchTexto && matchEstado && matchSexo && matchEdad;
  }).sort((a, b) => {
    if (orden === 'az') return a.nombre.localeCompare(b.nombre);
    if (orden === 'za') return b.nombre.localeCompare(a.nombre);
    if (orden === 'antiguo') return (a.ultimaVisita || '').localeCompare(b.ultimaVisita || '');
    return (b.ultimaVisita || '').localeCompare(a.ultimaVisita || '');
  });

  return (
    <div className="app-container">
      <NavTemporal />
      <HeaderClinico />

      <div className="clinical-container">
        <Link to="/consulta/1" className="back-link">
          ← Ir a la Consola de Dictado y Registro de Consulta
        </Link>

        <div className="page-layout">
          {/* Sidebar: Perfil del Doctor */}
          <aside className="sidebar">
            <div className="profile-photo-wrap">
              <img
                src={doctorAvatar}
                alt="Foto del Doctor"
                className="imagen-circular"
              />
            </div>

            <div className="sidebar-name">Dr. Diego Leal</div>
            <div className="sidebar-role">Medicina General · Hospital San Lucas</div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span className="status-pill">
                <span className="status-dot"></span>
                Médico Activo
              </span>
            </div>

            <hr className="sidebar-divider" />

            <div className="info-row">
              <span className="info-label">Cédula Profesional</span>
              <span className="info-value">CED-8492018</span>
            </div>

            <div className="info-row">
              <span className="info-label">Correo Institucional</span>
              <span className="info-value">diego.leal@medivoz.com</span>
            </div>

            <div className="info-row">
              <span className="info-label">Teléfono de consultorio</span>
              <span className="info-value">+52 (81) 8345-6789</span>
            </div>

            <div className="info-row">
              <span className="info-label">Base de Datos</span>
              <span className="info-value" style={{ color: 'var(--success)', fontWeight: 700 }}>MongoDB Atlas</span>
            </div>

            <hr className="sidebar-divider" />

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginBottom: '0.6rem' }}
              onClick={() => navigate('/consulta/1')}
            >
              🎤 Abrir Consulta con Voz
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '0.6rem' }}
              onClick={() => navigate('/paciente/agendar')}
            >
              📅 Agendar Nueva Cita
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => navigate('/paciente/nuevo')}
            >
              ➕ Registrar Nuevo Paciente
            </button>
          </aside>

          {/* Main: Búsqueda y Expedientes */}
          <main className="main-content">
            {/* Buscador y Filtros */}
            <div className="clinical-card search-card">
              <div className="card-title">
                <span className="icon">🔍</span>
                <span>Directorio y Búsqueda de Pacientes (MongoDB Atlas)</span>
              </div>

              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre, número de expediente o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="filters-row">
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  <option value="Todos">Filtrar por estado (Todos)</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="En tratamiento">En tratamiento</option>
                </select>

                <select value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
                  <option value="Todos">Filtrar por sexo (Todos)</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>

                <select value={filtroEdad} onChange={(e) => setFiltroEdad(e.target.value)}>
                  <option value="Todos">Filtrar por edad (Todos)</option>
                  <option value="0-12">0 - 12 años</option>
                  <option value="13-17">13 - 17 años</option>
                  <option value="18-40">18 - 40 años</option>
                  <option value="41-65">41 - 65 años</option>
                  <option value="65+">65+ años</option>
                </select>

                <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="reciente">Más reciente</option>
                  <option value="antiguo">Más antiguo</option>
                  <option value="az">Nombre A-Z</option>
                  <option value="za">Nombre Z-A</option>
                </select>
              </div>
            </div>

            {/* Resultados */}
            <div className="clinical-card records-section" style={{ marginTop: 0 }}>
              <div className="records-header">
                <div className="card-title" style={{ margin: 0 }}>
                  <span className="icon">📋</span>
                  <span>Pacientes en MongoDB Atlas</span>
                </div>
                <div className="table-badge">{pacientesFiltrados.length}</div>
              </div>

              <div className="table-wrap">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th>Expediente</th>
                      <th>Nombre completo</th>
                      <th>Edad</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Última visita</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.map((p, idx) => (
                      <tr key={`${p.expediente || 'p'}-${idx}`}>
                        <td><strong>{p.expediente}</strong></td>
                        <td>{p.nombre}</td>
                        <td>{p.edad}</td>
                        <td>{p.telefono}</td>
                        <td>
                          <span className={`tag ${p.estado === 'Activo' ? 'tag-accent' : p.estado === 'En tratamiento' ? '' : 'tag-danger'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td>{p.ultimaVisita || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-ver-receta"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}
                              onClick={() => navigate(`/consulta/${encodeURIComponent(p.expediente)}`, { state: { paciente: p } })}
                              title="Iniciar consulta médica para este paciente"
                            >
                              🩺 Consulta
                            </button>
                            <button
                              type="button"
                              className="btn-ver-receta"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              onClick={() => navigate(`/paciente/agendar?expediente=${encodeURIComponent(p.expediente)}`)}
                              title="Agendar cita para este paciente"
                            >
                              📅 Cita
                            </button>
                            <button
                              type="button"
                              className="btn-ver-receta"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              onClick={() => navigate(`/historial/${encodeURIComponent(p.expediente)}`)}
                            >
                              Historial
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!pacientesFiltrados.length && (
                      <tr>
                        <td colSpan={7} className="empty-state">
                          {cargando
                            ? 'Cargando pacientes desde MongoDB Atlas...'
                            : 'No se encontraron pacientes registrados en MongoDB Atlas.'}
                        </td>
                      </tr>
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
