import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import NavTemporal from '../componentes/NavTemporal';
import HeaderClinico from '../componentes/HeaderClinico';
import { obtenerPacientes, guardarConsulta, obtenerConsultasPorPaciente } from '../api/api';
import '../App.css';

const SUGERENCIAS_SINTOMAS = [
  'Cefalea pulsátil de intensidad moderada',
  'Fiebre cuantificada superior a 38.5°C',
  'Tos seca persistente y odinofagia',
  'Dolor torácico opresivo sin irradiación',
  'Malestar general, fatiga y mialgias',
  'Dolor abdominal difuso tipo cólico',
  'Náuseas y sensación de mareo postural'
];

const SUGERENCIAS_DIAGNOSTICOS = [
  'Cefalea tensional primaria',
  'Rinofaringitis aguda (resfriado común)',
  'Hipertensión arterial sistémica estadio 1',
  'Diabetes mellitus tipo 2 descompensada',
  'Gastroenteritis infecciosa de presunto origen bacteriano',
  'Lumbalgia mecánica aguda'
];

const FARMACOS_FRECUENTES = [
  { nombre: 'Paracetamol', dosis: '500 mg cada 8 horas por 3 días vía oral' },
  { nombre: 'Ibuprofeno', dosis: '400 mg cada 8 horas después de alimentos por 5 días' },
  { nombre: 'Amoxicilina / Ác. Clavulánico', dosis: '500/125 mg cada 8 horas por 7 días vía oral' },
  { nombre: 'Omeprazol', dosis: '20 mg cada 24 horas en ayunas durante 14 días' },
  { nombre: 'Ketorolaco', dosis: '10 mg sublingual cada 12 horas condicionado a dolor severo' },
  { nombre: 'Losartán', dosis: '50 mg cada 24 horas por la mañana vía oral' }
];

function hoyISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function horaActual() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatearDictado(texto) {
  return texto
    .trim()
    .replace(/\bpunto y aparte\b/gi, '.\n\n')
    .replace(/\bpunto y coma\b/gi, ';')
    .replace(/\bpunto\b/gi, '.')
    .replace(/\bcoma\b/gi, ',')
    .replace(/\bdos puntos\b/gi, ':')
    .replace(/\bnueva l[ií]nea\b/gi, '\n')
    .replace(/\bsigno de interrogaci[oó]n\b/gi, '?');
}

export default function Consulta() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Lista de pacientes cargados exclusivamente desde MongoDB Atlas
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(true);

  // Paciente seleccionado actualmente
  const [pacienteActual, setPacienteActual] = useState(null);
  const [mostrarSelectorPaciente, setMostrarSelectorPaciente] = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');

  // Historial de consultas registradas en sesión y MongoDB
  const [registros, setRegistros] = useState(() => {
    return JSON.parse(sessionStorage.getItem('mv_registros') || '[]');
  });

  // Pestaña de historial en la parte inferior ('paciente' o 'todos')
  const [tabHistorial, setTabHistorial] = useState('paciente');

  // Estado del formulario clínico
  const [form, setForm] = useState({
    paciente: '',
    medico: 'Dr. Diego Leal',
    fecha: hoyISO(),
    hora: horaActual(),
    tipoConsulta: 'Consulta general',
    sintomas: '',
    notas: '',
    categoria: 'General',
    severidad: 'Leve',
    presion: '120/80',
    frecuencia: '75',
    temperatura: '36.5',
    frecuenciaResp: '18',
    saturacionO2: '98',
    peso: '74',
    talla: '172',
  });

  // Diagnósticos
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState('');

  // Medicamentos
  const [medicamentos, setMedicamentos] = useState([]);
  const [medNombre, setMedNombre] = useState('');
  const [medDosis, setMedDosis] = useState('');

  // Alergias
  const [alergias, setAlergias] = useState([]);
  const [nuevaAlergia, setNuevaAlergia] = useState('');
  const [sinAlergias, setSinAlergias] = useState(false);

  // Archivos adjuntos
  const [archivos, setArchivos] = useState([]);

  // Notificaciones y validaciones
  const [toast, setToast] = useState({ mensaje: '', tipo: '', visible: false });
  const [campoInvalido, setCampoInvalido] = useState('');

  // Dictado por voz
  const [campoActivo, setCampoActivo] = useState('sintomas');
  const [escuchando, setEscuchando] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);

  // Cargar lista fresca y real de pacientes exclusivamente desde MongoDB Atlas
  useEffect(() => {
    let activo = true;
    setCargandoPacientes(true);

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
                _id: p._id,
                expediente: p.expediente,
                nombre: nombreCompleto,
                edad: calcEdad,
                fechaNacimiento: p.fechaNacimiento || '',
                sexo: p.sexo || 'Otro',
                tipoSangre: p.tipoSangre || '—',
                telefono: p.telefono || '—',
                correo: p.correo || '',
                alergias: Array.isArray(p.alergias) ? p.alergias : (p.alergias ? [p.alergias] : []),
                estado: p.estado || 'Activo'
              });
            }
          });
          const listaFresca = Array.from(map.values());
          setPacientes(listaFresca);
          sessionStorage.setItem('mv_pacientes', JSON.stringify(listaFresca));
        }
      })
      .catch(err => console.error('Error cargando pacientes desde MongoDB:', err))
      .finally(() => {
        if (activo) setCargandoPacientes(false);
      });

    return () => { activo = false; };
  }, []);

  // Seleccionar automáticamente el paciente de MongoDB adecuado
  useEffect(() => {
    if (pacientes.length === 0) return;

    let pacienteEncontrado = null;

    if (location.state?.paciente) {
      pacienteEncontrado = pacientes.find(p => p.expediente === location.state.paciente.expediente) || location.state.paciente;
    } else if (location.state?.cita) {
      const cita = location.state.cita;
      pacienteEncontrado = pacientes.find(p => p.expediente === cita.expediente || p.nombre === cita.paciente);
      if (cita.motivo) {
        setForm(prev => ({ ...prev, sintomas: cita.motivo, hora: cita.hora || prev.hora }));
      }
    } else if (id) {
      const expBuscado = id.startsWith('EXP') ? id : `EXP-${String(id).padStart(6, '0')}`;
      pacienteEncontrado = pacientes.find((p, idx) => p.expediente === id || p.expediente === expBuscado || String(idx + 1) === String(id) || p._id === id);
    }

    if (!pacienteEncontrado && pacientes.length > 0) {
      pacienteEncontrado = pacientes[0];
    }

    if (pacienteEncontrado) {
      aplicarDatosPaciente(pacienteEncontrado);
    }
  }, [id, location.state, pacientes]);

  // Precargar datos del paciente real seleccionado
  const aplicarDatosPaciente = async (p) => {
    setPacienteActual(p);
    setForm(prev => ({ ...prev, paciente: p.expediente }));

    // Cargar alergias reales del paciente desde MongoDB Atlas
    const alergiasPaciente = (p.alergias || []).filter(a => a && a !== 'Ninguna');
    if (alergiasPaciente.length > 0) {
      setAlergias(alergiasPaciente);
      setSinAlergias(false);
    } else {
      setAlergias([]);
      setSinAlergias(true);
    }

    // Cargar consultas previas de este paciente desde MongoDB Atlas
    try {
      const resConsultas = await obtenerConsultasPorPaciente(p.expediente);
      if (resConsultas && resConsultas.success && Array.isArray(resConsultas.data)) {
        // Mezclar con las de sesión sin duplicar
        setRegistros(prev => {
          const map = new Map();
          resConsultas.data.forEach(c => map.set(c._id || c.id, {
            ...c,
            id: c._id || c.id,
            pacienteTexto: c.pacienteNombre ? `${c.pacienteNombre} · ${c.pacienteExpediente}` : p.nombre
          }));
          prev.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    } catch (errConsultas) {
      console.warn('Consultas de MongoDB no disponibles:', errConsultas);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('mv_registros', JSON.stringify(registros));
  }, [registros]);

  // Cálculo de IMC
  const imcData = useMemo(() => {
    const pesoNum = parseFloat(form.peso);
    const tallaNum = parseFloat(form.talla);
    if (!pesoNum || !tallaNum || pesoNum <= 0 || tallaNum <= 0) {
      return { valor: null, estado: 'Incompleto', clase: '' };
    }
    const tallaMetros = tallaNum / 100;
    const imc = pesoNum / (tallaMetros * tallaMetros);
    const valor = imc.toFixed(1);

    if (imc < 18.5) return { valor, estado: 'Bajo peso', clase: 'bmi-warning' };
    if (imc <= 24.9) return { valor, estado: 'Peso normal', clase: '' };
    if (imc <= 29.9) return { valor, estado: 'Sobrepeso', clase: 'bmi-warning' };
    return { valor, estado: 'Obesidad', clase: 'bmi-danger' };
  }, [form.peso, form.talla]);

  const mostrarToast = (mensaje, tipo = '') => {
    setToast({ mensaje, tipo, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2800);
  };

  const marcarInvalido = (campo) => {
    setCampoInvalido(campo);
    setTimeout(() => setCampoInvalido(''), 1600);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const seleccionarPacientePorExpediente = (expediente) => {
    if (expediente === '__nuevo__') {
      navigate('/paciente/nuevo');
      return;
    }
    const encontrado = pacientes.find(p => p.expediente === expediente);
    if (encontrado) {
      aplicarDatosPaciente(encontrado);
      setMostrarSelectorPaciente(false);
      mostrarToast(`Paciente cargado: ${encontrado.nombre}`);
    }
  };

  // Reconocimiento de voz
  const detenerMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar
      }
      recognitionRef.current = null;
    }
    setEscuchando(false);
  };

  const iniciarDictadoEnCampo = async (campoNombre) => {
    setCampoActivo(campoNombre);

    if (escuchando && campoActivo === campoNombre) {
      detenerMic();
      mostrarToast('Micrófono detenido.');
      return;
    }

    detenerMic();
    setMicError('');

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      const msg = 'Tu navegador no soporta reconocimiento de voz nativo. Utiliza Google Chrome o Microsoft Edge.';
      setMicError(msg);
      mostrarToast(msg, 'error');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr) {
      console.warn('Permiso de micrófono denegado:', permErr);
      const msg = 'Permiso de micrófono denegado. Habilita el acceso en tu navegador.';
      setMicError(msg);
      mostrarToast(msg, 'error');
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.lang = 'es-MX';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setEscuchando(true);
        setMicError('');
        const etiquetaCampo = campoNombre === 'sintomas' ? 'Síntomas' : campoNombre === 'notas' ? 'Notas clínicas' : 'Diagnóstico';
        mostrarToast(`🎤 Escuchando para: ${etiquetaCampo}`);
      };

      rec.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += formatearDictado(item[0].transcript) + ' ';
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const textoCompleto = (finalTranscript || interimTranscript).trim();
        setLiveText(textoCompleto);

        if (finalTranscript.trim()) {
          const texto = finalTranscript.trim();
          if (campoNombre === 'sintomas') {
            setForm(prev => ({ ...prev, sintomas: prev.sintomas ? `${prev.sintomas} ${texto}` : texto }));
          } else if (campoNombre === 'notas') {
            setForm(prev => ({ ...prev, notas: prev.notas ? `${prev.notas} ${texto}` : texto }));
          } else if (campoNombre === 'diagnostico') {
            setNuevoDiagnostico(prev => prev ? `${prev} ${texto}` : texto);
          }
        }
      };

      rec.onerror = (err) => {
        setEscuchando(false);
        if (err.error !== 'no-speech') {
          setMicError(`Aviso de dictado: ${err.error}`);
        }
      };

      rec.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setEscuchando(false);
      setMicError('No se pudo iniciar el micrófono: ' + (err.message || 'Error'));
    }
  };

  // Diagnósticos
  const agregarDiagnostico = (textoDirecto) => {
    const diag = (textoDirecto || nuevoDiagnostico).trim();
    if (!diag) return;
    if (!diagnosticos.includes(diag)) {
      setDiagnosticos(prev => [...prev, diag]);
    }
    setNuevoDiagnostico('');
  };

  const quitarDiagnostico = (idx) => {
    setDiagnosticos(prev => prev.filter((_, i) => i !== idx));
  };

  // Medicamentos
  const agregarMedicamento = (farmacoRapido) => {
    const nombre = (farmacoRapido?.nombre || medNombre).trim();
    const dosis = (farmacoRapido?.dosis || medDosis).trim();

    if (!nombre) {
      mostrarToast('Ingresa el nombre del medicamento.', 'error');
      marcarInvalido('medNombre');
      return;
    }

    setMedicamentos(prev => [...prev, { nombre, dosis }]);
    setMedNombre('');
    setMedDosis('');
  };

  const quitarMedicamento = (idx) => {
    setMedicamentos(prev => prev.filter((_, i) => i !== idx));
  };

  // Alergias
  const agregarAlergia = () => {
    if (sinAlergias || !nuevaAlergia.trim()) return;
    setAlergias(prev => [...prev, nuevaAlergia.trim()]);
    setNuevaAlergia('');
  };

  const quitarAlergia = (idx) => {
    setAlergias(prev => prev.filter((_, i) => i !== idx));
  };

  // Archivos
  const adjuntarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const tamanoKb = Math.round(file.size / 1024);
      setArchivos(prev => [...prev, { nombre: file.name, tamano: `${tamanoKb} KB`, estado: 'Adjunto' }]);
      e.target.value = '';
    }
  };

  // Guardar consulta directamente en MongoDB Atlas
  const guardarRegistroConsulta = async (redireccionarAReceta = false) => {
    if (!pacienteActual) {
      mostrarToast('Selecciona un paciente antes de guardar.', 'error');
      return;
    }

    const pacienteTexto = `${pacienteActual.nombre} · ${pacienteActual.expediente}`;
    const nuevoId = registros.length ? Math.max(...registros.map(r => r.id || 0)) + 1 : 1;

    const registroData = {
      id: nuevoId,
      pacienteId: pacienteActual.expediente,
      pacienteExpediente: pacienteActual.expediente,
      pacienteTexto,
      ...form,
      imc: imcData.valor || '',
      diagnosticos: [...diagnosticos],
      medicamentos: [...medicamentos],
      alergias: sinAlergias ? ['Sin alergias conocidas'] : [...alergias],
      archivos: archivos.map(a => a.nombre),
      generadoEl: new Date().toISOString()
    };

    // Guardar en MongoDB Atlas
    try {
      const resGuardado = await guardarConsulta({
        pacienteId: pacienteActual.expediente,
        pacienteExpediente: pacienteActual.expediente,
        pacienteNombre: pacienteActual.nombre,
        medico: form.medico,
        tipoConsulta: form.tipoConsulta,
        categoria: form.categoria,
        severidad: form.severidad,
        presion: form.presion,
        frecuencia: form.frecuencia,
        temperatura: form.temperatura,
        peso: form.peso,
        talla: form.talla,
        imc: imcData.valor || '',
        sintomas: form.sintomas,
        diagnosticos: diagnosticos,
        medicamentos: medicamentos,
        alergias: sinAlergias ? ['Sin alergias conocidas'] : alergias,
        notas: form.notas
      });

      if (resGuardado && resGuardado.success) {
        mostrarToast('Consulta guardada exitosamente en MongoDB Atlas.');
      } else {
        mostrarToast('Consulta registrada localmente.');
      }
    } catch (apiErr) {
      console.warn('API error al guardar consulta en MongoDB:', apiErr);
      mostrarToast('Consulta respaldada localmente (servidor no disponible).');
    }

    const nuevosRegistros = [registroData, ...registros];
    setRegistros(nuevosRegistros);

    const recetasObj = JSON.parse(sessionStorage.getItem('mv_recetas') || '{}');
    recetasObj[nuevoId] = registroData;
    sessionStorage.setItem('mv_recetas', JSON.stringify(recetasObj));

    if (redireccionarAReceta) {
      setTimeout(() => navigate(`/receta/${nuevoId}`), 300);
    }
  };

  const limpiarFormulario = () => {
    setForm(prev => ({
      ...prev,
      fecha: hoyISO(),
      hora: horaActual(),
      tipoConsulta: 'Consulta general',
      sintomas: '',
      notas: '',
      categoria: 'General',
      severidad: 'Leve',
      presion: '120/80',
      frecuencia: '75',
      temperatura: '36.5',
      frecuenciaResp: '18',
      saturacionO2: '98',
      peso: '74',
      talla: '172',
    }));
    setDiagnosticos([]);
    setMedicamentos([]);
    setArchivos([]);
    mostrarToast('Formulario restablecido para nueva consulta.');
  };

  const registrosDelPaciente = useMemo(() => {
    if (!pacienteActual) return [];
    return registros.filter(r =>
      r.pacienteExpediente === pacienteActual.expediente ||
      r.pacienteId === pacienteActual.expediente ||
      (r.pacienteTexto && r.pacienteTexto.includes(pacienteActual.expediente))
    );
  }, [registros, pacienteActual]);

  const pacientesFiltradosSelector = useMemo(() => {
    if (!busquedaPaciente.trim()) return pacientes;
    const q = busquedaPaciente.toLowerCase();
    return pacientes.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.expediente || '').toLowerCase().includes(q)
    );
  }, [pacientes, busquedaPaciente]);

  const inicialesPaciente = useMemo(() => {
    if (!pacienteActual?.nombre) return 'PX';
    const partes = pacienteActual.nombre.trim().split(/\s+/);
    if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return partes[0].slice(0, 2).toUpperCase();
  }, [pacienteActual]);

  if (cargandoPacientes) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Conectando y cargando pacientes desde MongoDB Atlas...</p>
        </div>
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="app-container">
        <NavTemporal />
        <HeaderClinico />
        <div className="clinical-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No hay pacientes registrados en MongoDB Atlas</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Para iniciar el registro de consultas clínicas, registra tu primer paciente en el sistema.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('/paciente/nuevo')}>
            + Registrar Primer Paciente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavTemporal />
      <HeaderClinico />

      <div className="clinical-container">
        {/* FICHA CLÍNICA DEL PACIENTE PRECARGADO DESDE MONGODB */}
        {pacienteActual && (
          <div className="patient-summary-banner">
            <div className="patient-banner-top">
              <div className="patient-main-identity">
                <div className="patient-avatar-circle">
                  {inicialesPaciente}
                </div>
                <div className="patient-title-group">
                  <h2>
                    {pacienteActual.nombre}
                    <span className="expediente-badge">{pacienteActual.expediente}</span>
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Médico responsable: <strong>{form.medico}</strong> · Céd. CED-8492018 · Medicina General
                  </div>
                </div>
              </div>

              <div className="patient-banner-actions">
                <button
                  type="button"
                  className="btn-banner-action"
                  onClick={() => setMostrarSelectorPaciente(prev => !prev)}
                  title="Cambiar paciente seleccionado"
                >
                  🔄 {mostrarSelectorPaciente ? 'Cerrar selector' : 'Cambiar paciente'}
                </button>

                <button
                  type="button"
                  className="btn-banner-action action-primary"
                  onClick={() => navigate(`/historial/${encodeURIComponent(pacienteActual.expediente)}`)}
                >
                  📋 Ver Historial Completo
                </button>

                <button
                  type="button"
                  className="btn-banner-action"
                  onClick={() => navigate(`/paciente/agendar?expediente=${encodeURIComponent(pacienteActual.expediente)}`)}
                >
                  📅 Agendar Cita
                </button>
              </div>
            </div>

            {/* Selector desplegable de pacientes */}
            {mostrarSelectorPaciente && (
              <div className="patient-switch-drawer">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o expediente..."
                    value={busquedaPaciente}
                    onChange={(e) => setBusquedaPaciente(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    className="btn-banner-action action-primary"
                    onClick={() => navigate('/paciente/nuevo')}
                  >
                    + Registrar Nuevo Paciente
                  </button>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {pacientesFiltradosSelector.map(p => (
                    <div
                      key={p.expediente}
                      onClick={() => seleccionarPacientePorExpediente(p.expediente)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.75rem',
                        background: p.expediente === pacienteActual.expediente ? 'var(--primary-light)' : '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <strong>{p.nombre}</strong>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>({p.expediente})</span>
                      </div>
                      <span className="tag" style={{ fontSize: '0.72rem' }}>{p.sexo} · {p.edad}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadatos demográficos del paciente precargado de MongoDB */}
            <div className="patient-meta-grid">
              <div className="meta-item">
                <span className="meta-item-label">Edad / Sexo</span>
                <span className="meta-item-value">{pacienteActual.edad} · {pacienteActual.sexo}</span>
              </div>
              <div className="meta-item">
                <span className="meta-item-label">Tipo de Sangre</span>
                <span className="meta-item-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  🩸 {pacienteActual.tipoSangre || '—'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-item-label">Teléfono</span>
                <span className="meta-item-value">{pacienteActual.telefono || '—'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-item-label">Correo</span>
                <span className="meta-item-value">{pacienteActual.correo || '—'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-item-label">Estado</span>
                <span className="meta-item-value" style={{ color: 'var(--success)' }}>
                  ✓ {pacienteActual.estado || 'Activo'} (MongoDB)
                </span>
              </div>
            </div>

            {/* Alerta de Alergias Reales */}
            {alergias.length > 0 && !sinAlergias ? (
              <div className="patient-allergy-alert has-allergies">
                <span>⚠️</span>
                <span>
                  <strong>ALERGIAS REGISTRADAS EN MONGODB:</strong> {alergias.join(', ')}. Verifica contraindicaciones al formular medicamentos.
                </span>
              </div>
            ) : (
              <div className="patient-allergy-alert no-allergies">
                <span>🛡️</span>
                <span><strong>Alergias:</strong> Sin alergias medicamentosas conocidas reportadas en MongoDB Atlas.</span>
              </div>
            )}
          </div>
        )}

        {/* BARRA INTELIGENTE DE DICTADO */}
        <div className={`smart-voice-bar ${escuchando ? 'is-listening' : ''}`}>
          <div className="voice-status-indicator">
            <button
              type="button"
              className={`voice-mic-circle-btn ${escuchando ? 'listening' : ''}`}
              onClick={() => iniciarDictadoEnCampo(campoActivo)}
              title={escuchando ? 'Detener dictado' : `Iniciar dictado por voz en ${campoActivo}`}
            >
              {escuchando ? '⏹️' : '🎤'}
            </button>

            {escuchando && (
              <div className="voice-wave-bars">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            )}

            <div className="voice-current-target">
              {escuchando ? 'Escuchando para:' : 'Listo para dictar en:'}
              <span className="voice-target-pill">
                {campoActivo === 'sintomas' ? 'Motivo y Síntomas' : campoActivo === 'notas' ? 'Notas y Exploración' : 'Diagnóstico'}
              </span>
            </div>
          </div>

          <div className="voice-transcript-inline">
            {liveText ? (
              <span><strong>Transcripción:</strong> {liveText}</span>
            ) : (
              <span style={{ color: 'var(--text-light)' }}>
                {escuchando ? 'Habla con claridad, se transcribirá en tiempo real...' : 'Haz clic en el micrófono de cualquier campo para dictar directamente.'}
              </span>
            )}
          </div>

          {micError && (
            <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>
              ⚠️ {micError}
            </div>
          )}
        </div>

        {/* CUERPO PRINCIPAL DE LA CONSULTA */}
        <div className="consultation-layout">
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Tarjeta 1: Datos de la Atención y Signos Vitales */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <div className="clinical-card-header-title">
                  <span>🩺</span>
                  <span>Datos de la Atención y Signos Vitales</span>
                </div>
                <span className="clinical-card-header-badge">Paso 1 de 4</span>
              </div>

              <div className="vitals-inputs-grid" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <label htmlFor="tipoConsulta">Tipo de Consulta</label>
                  <select
                    id="tipoConsulta"
                    name="tipoConsulta"
                    value={form.tipoConsulta}
                    onChange={handleInputChange}
                  >
                    <option>Consulta general</option>
                    <option>Seguimiento y control</option>
                    <option>Urgencia menor</option>
                    <option>Revisión de estudios</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fecha">Fecha</label>
                  <input
                    type="date"
                    id="fecha"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="hora">Hora</label>
                  <input
                    type="time"
                    id="hora"
                    name="hora"
                    value={form.hora}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="severidad">Severidad</label>
                  <select
                    id="severidad"
                    name="severidad"
                    value={form.severidad}
                    onChange={handleInputChange}
                  >
                    <option>Leve</option>
                    <option>Moderado</option>
                    <option>Grave</option>
                    <option>Crítico</option>
                  </select>
                </div>
              </div>

              <div className="form-subtitle" style={{ fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                Signos Vitales y Somatometría
              </div>

              <div className="vitals-inputs-grid">
                <div>
                  <label htmlFor="presion">Presión Arterial</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="presion"
                      name="presion"
                      placeholder="120/80"
                      value={form.presion}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">mmHg</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="frecuencia">Frecuencia Cardíaca</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="frecuencia"
                      name="frecuencia"
                      placeholder="75"
                      value={form.frecuencia}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">lpm</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="temperatura">Temperatura</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="temperatura"
                      name="temperatura"
                      placeholder="36.5"
                      value={form.temperatura}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">°C</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="frecuenciaResp">Frec. Respiratoria</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="frecuenciaResp"
                      name="frecuenciaResp"
                      placeholder="18"
                      value={form.frecuenciaResp}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">rpm</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="saturacionO2">Saturación O₂</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="saturacionO2"
                      name="saturacionO2"
                      placeholder="98"
                      value={form.saturacionO2}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">%</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="peso">Peso Corporal</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="peso"
                      name="peso"
                      placeholder="74"
                      value={form.peso}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">kg</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="talla">Estatura / Talla</label>
                  <div className="vital-input-unit-wrap">
                    <input
                      type="text"
                      id="talla"
                      name="talla"
                      placeholder="172"
                      value={form.talla}
                      onChange={handleInputChange}
                    />
                    <span className="vital-unit-addon">cm</span>
                  </div>
                </div>
              </div>

              {imcData.valor && (
                <div className={`bmi-widget ${imcData.clase}`}>
                  <div className="bmi-value-box">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Índice de Masa Corporal (IMC):</span>
                    <span className="bmi-number">{imcData.valor}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg/m²</span>
                  </div>
                  <span className="bmi-status-pill">{imcData.estado}</span>
                </div>
              )}
            </div>

            {/* Tarjeta 2: Anamnesis y Exploración Física */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <div className="clinical-card-header-title">
                  <span>📝</span>
                  <span>Anamnesis y Exploración Física</span>
                </div>
                <span className="clinical-card-header-badge">Paso 2 de 4</span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="sintomas" style={{ margin: 0 }}>
                    Motivo de Consulta y Síntomas Referidos
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Dictado por voz disponible
                  </span>
                </div>

                <div className="input-with-inline-mic">
                  <textarea
                    id="sintomas"
                    name="sintomas"
                    rows={3}
                    placeholder="Describe los síntomas referidos por el paciente, tiempo de evolución e intensidad..."
                    value={form.sintomas}
                    onChange={handleInputChange}
                    onFocus={() => setCampoActivo('sintomas')}
                  />
                  <button
                    type="button"
                    className={`mic-field-button ${escuchando && campoActivo === 'sintomas' ? 'field-listening' : ''}`}
                    onClick={() => iniciarDictadoEnCampo('sintomas')}
                    title="Dictar en este campo"
                  >
                    🎤
                  </button>
                </div>

                <div className="quick-chips-row">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.2rem' }}>Sugerencias:</span>
                  {SUGERENCIAS_SINTOMAS.slice(0, 4).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-chip"
                      onClick={() => setForm(prev => ({ ...prev, sintomas: prev.sintomas ? `${prev.sintomas}. ${s}` : s }))}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="notas" style={{ margin: 0 }}>
                    Exploración Física y Notas Clínicas
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Dictado por voz disponible
                  </span>
                </div>

                <div className="input-with-inline-mic">
                  <textarea
                    id="notas"
                    name="notas"
                    rows={3}
                    placeholder="Hallazgos en la exploración física, ruidos cardíacos, campos pulmonares, abdomen o indicaciones..."
                    value={form.notas}
                    onChange={handleInputChange}
                    onFocus={() => setCampoActivo('notas')}
                  />
                  <button
                    type="button"
                    className={`mic-field-button ${escuchando && campoActivo === 'notas' ? 'field-listening' : ''}`}
                    onClick={() => iniciarDictadoEnCampo('notas')}
                    title="Dictar en este campo"
                  >
                    🎤
                  </button>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Diagnósticos y Alergias */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <div className="clinical-card-header-title">
                  <span>🔬</span>
                  <span>Diagnósticos y Alergias</span>
                </div>
                <span className="clinical-card-header-badge">Paso 3 de 4</span>
              </div>

              <label htmlFor="input-diagnostico">Impresión Diagnóstica (CIE-10)</label>
              <div className="tag-input-row">
                <input
                  id="input-diagnostico"
                  type="text"
                  placeholder="Escribe o dicta el diagnóstico y presiona Enter o '+'..."
                  value={nuevoDiagnostico}
                  onChange={(e) => setNuevoDiagnostico(e.target.value)}
                  onFocus={() => setCampoActivo('diagnostico')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarDiagnostico();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`btn-add-tag ${escuchando && campoActivo === 'diagnostico' ? 'field-listening' : ''}`}
                  onClick={() => iniciarDictadoEnCampo('diagnostico')}
                  title="Dictar diagnóstico"
                  style={{ backgroundColor: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--border-color)', padding: '0 0.8rem' }}
                >
                  🎤
                </button>
                <button className="btn-add-tag" type="button" onClick={() => agregarDiagnostico()}>+</button>
              </div>

              <div className="quick-chips-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.2rem' }}>Frecuentes:</span>
                {SUGERENCIAS_DIAGNOSTICOS.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-chip"
                    onClick={() => agregarDiagnostico(d)}
                  >
                    + {d}
                  </button>
                ))}
              </div>

              <div className="tag-list tag-preview-list">
                {diagnosticos.map((d, i) => (
                  <span key={i} className="tag tag-accent" style={{ padding: '0.4rem 0.85rem' }}>
                    {d}
                    <span className="tag-remove" onClick={() => quitarDiagnostico(i)}>✕</span>
                  </span>
                ))}
                {!diagnosticos.length && (
                  <span className="tag" style={{ opacity: 0.6 }}>No hay diagnósticos agregados aún</span>
                )}
              </div>

              <hr className="sidebar-divider" style={{ margin: '1rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0, fontWeight: 700 }}>Alergias Documentadas</label>
                <div className="checkbox-row" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    id="sinAlergiasCheck"
                    checked={sinAlergias}
                    onChange={(e) => {
                      setSinAlergias(e.target.checked);
                      if (e.target.checked) setAlergias([]);
                    }}
                  />
                  <label htmlFor="sinAlergiasCheck" style={{ fontSize: '0.82rem', cursor: 'pointer', margin: 0 }}>
                    Sin alergias conocidas
                  </label>
                </div>
              </div>

              {!sinAlergias && (
                <div className="tag-input-row" style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Registrar nueva alergia detectada..."
                    value={nuevaAlergia}
                    onChange={(e) => setNuevaAlergia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarAlergia();
                      }
                    }}
                  />
                  <button className="btn-add-tag" type="button" onClick={agregarAlergia}>+ Agregar</button>
                </div>
              )}

              <div className="tag-list tag-preview-list">
                {sinAlergias ? (
                  <span className="tag" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                    🛡️ Sin alergias conocidas reportadas
                  </span>
                ) : (
                  alergias.map((a, i) => (
                    <span key={i} className="tag tag-danger">
                      ⚠️ {a}
                      <span className="tag-remove" onClick={() => quitarAlergia(i)}>✕</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Tarjeta 4: Prescripción Médica y Receta */}
            <div className="clinical-card">
              <div className="clinical-card-header">
                <div className="clinical-card-header-title">
                  <span>💊</span>
                  <span>Prescripción Médica y Tratamiento (Receta)</span>
                </div>
                <span className="clinical-card-header-badge">Paso 4 de 4</span>
              </div>

              <div className="rx-builder-container">
                <div className="rx-builder-grid">
                  <div>
                    <label>Medicamento</label>
                    <input
                      type="text"
                      placeholder="Ej. Paracetamol 500 mg"
                      value={medNombre}
                      onChange={(e) => setMedNombre(e.target.value)}
                      className={campoInvalido === 'medNombre' ? 'campo-invalido' : ''}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Dosis, Vía, Frecuencia e Indicaciones</label>
                    <input
                      type="text"
                      placeholder="Ej. 1 tableta cada 8 horas vía oral por 5 días con alimentos"
                      value={medDosis}
                      onChange={(e) => setMedDosis(e.target.value)}
                    />
                  </div>
                </div>

                <div className="quick-chips-row" style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.2rem' }}>Plantillas:</span>
                  {FARMACOS_FRECUENTES.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-chip"
                      onClick={() => agregarMedicamento(f)}
                    >
                      + {f.nombre}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.65rem' }}
                  onClick={() => agregarMedicamento()}
                >
                  + Agregar Fármaco a la Receta
                </button>
              </div>

              <div className="rx-med-cards-list">
                {medicamentos.map((m, i) => (
                  <div key={i} className="rx-med-item-card">
                    <div>
                      <div className="rx-med-name">{i + 1}. {m.nombre}</div>
                      <div className="rx-med-dosage">{m.dosis || 'Dosis a criterio médico'}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                      onClick={() => quitarMedicamento(i)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {!medicamentos.length && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    No has agregado medicamentos a la receta aún. Utiliza el formulario superior o las plantillas rápidas.
                  </div>
                )}
              </div>

              <hr className="sidebar-divider" style={{ margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0, fontWeight: 700 }}>Estudios de Laboratorio e Imagenología</label>
                <div>
                  <input type="file" id="archivoInputConsulta" style={{ display: 'none' }} onChange={adjuntarArchivo} />
                  <label htmlFor="archivoInputConsulta" className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                    📎 Adjuntar Estudio
                  </label>
                </div>
              </div>

              {archivos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {archivos.map((f, i) => (
                    <div key={i} className="file-item" style={{ padding: '0.5rem 0.85rem' }}>
                      <div>
                        <span className="file-name" style={{ fontSize: '0.82rem' }}>{f.nombre}</span>
                        <span className="file-meta" style={{ marginLeft: '0.5rem' }}>({f.tamano || 'PDF'})</span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setArchivos(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* SIDEBAR CLÍNICO */}
          <aside className="consultation-summary-panel">
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                Resumen de Consulta (MongoDB)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {pacienteActual?.nombre || 'Paciente'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {form.tipoConsulta} · {form.fecha}
              </div>
            </div>

            <div className="summary-checklist">
              <div className={`summary-check-item ${pacienteActual ? 'done' : ''}`}>
                <span>Paciente identificado</span>
                <span className="summary-check-icon">{pacienteActual ? '✓' : '○'}</span>
              </div>
              <div className={`summary-check-item ${form.presion && form.temperatura ? 'done' : ''}`}>
                <span>Signos vitales registrados</span>
                <span className="summary-check-icon">{form.presion ? '✓' : '○'}</span>
              </div>
              <div className={`summary-check-item ${form.sintomas.trim() ? 'done' : ''}`}>
                <span>Motivo de consulta documentado</span>
                <span className="summary-check-icon">{form.sintomas.trim() ? '✓' : '○'}</span>
              </div>
              <div className={`summary-check-item ${diagnosticos.length > 0 ? 'done' : ''}`}>
                <span>Diagnósticos ({diagnosticos.length})</span>
                <span className="summary-check-icon">{diagnosticos.length > 0 ? '✓' : '○'}</span>
              </div>
              <div className={`summary-check-item ${medicamentos.length > 0 ? 'done' : ''}`}>
                <span>Medicamentos ({medicamentos.length})</span>
                <span className="summary-check-icon">{medicamentos.length > 0 ? '✓' : '○'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '0.92rem' }}
                onClick={() => guardarRegistroConsulta(false)}
              >
                💾 Guardar Consulta en MongoDB
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  backgroundColor: 'var(--secondary)',
                  borderColor: 'var(--secondary)'
                }}
                onClick={() => guardarRegistroConsulta(true)}
              >
                📄 Guardar y Emitir Receta
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.82rem' }}
                onClick={limpiarFormulario}
              >
                🧹 Limpiar Formulario
              </button>
            </div>

            <hr className="sidebar-divider" style={{ margin: '0.5rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                onClick={() => navigate('/dashboard')}
              >
                🔍 Directorio de Pacientes
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', padding: '0.5rem 0.75rem' }}
                onClick={() => navigate('/dashboard1')}
              >
                📅 Agenda de Citas del Día
              </button>
            </div>
          </aside>
        </div>

        {/* CONSULTAS GUARDADAS EN MONGODB ATLAS */}
        <div className="clinical-card records-section" style={{ marginTop: '2rem' }}>
          <div className="consultation-tabs-nav">
            <button
              type="button"
              className={`tab-nav-btn ${tabHistorial === 'paciente' ? 'tab-active' : ''}`}
              onClick={() => setTabHistorial('paciente')}
            >
              📋 Consultas de {pacienteActual?.nombre || 'este paciente'} en MongoDB ({registrosDelPaciente.length})
            </button>

            <button
              type="button"
              className={`tab-nav-btn ${tabHistorial === 'todos' ? 'tab-active' : ''}`}
              onClick={() => setTabHistorial('todos')}
            >
              🕒 Todas las Consultas Registradas ({registros.length})
            </button>
          </div>

          <div className="table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Diagnósticos</th>
                  <th>Presión / Temp</th>
                  <th>Severidad</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(tabHistorial === 'paciente' ? registrosDelPaciente : registros).map((r, idx) => (
                  <tr key={r.id || r._id || idx}>
                    <td><strong>#{r.id || idx + 1}</strong></td>
                    <td>{r.pacienteTexto || r.pacienteNombre}</td>
                    <td>{r.tipoConsulta || 'Consulta general'}</td>
                    <td>{(r.diagnosticos || []).join(', ') || '—'}</td>
                    <td>{r.presion || '—'} · {r.temperatura ? `${r.temperatura}°C` : '—'}</td>
                    <td>
                      <span className={`tag ${r.severidad === 'Grave' || r.severidad === 'Crítico' ? 'tag-danger' : 'tag-accent'}`}>
                        {r.severidad || 'Leve'}
                      </span>
                    </td>
                    <td>{r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ver-receta"
                        onClick={() => navigate(`/receta/${r.id || r._id || idx + 1}`)}
                      >
                        Ver receta
                      </button>
                    </td>
                  </tr>
                ))}

                {!(tabHistorial === 'paciente' ? registrosDelPaciente : registros).length && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      {tabHistorial === 'paciente'
                        ? 'Este paciente aún no tiene consultas registradas en MongoDB Atlas.'
                        : 'No hay consultas registradas en la base de datos.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast.visible && (
        <div className={`toast-notification ${toast.tipo === 'error' ? 'toast-error' : ''}`}>
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}
