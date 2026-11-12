// Registro de pacientes (público): el paciente crea su cuenta para poder agendar citas.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioPaciente from '../../componentes/FormularioPaciente';
import { registrarPaciente } from '../../api/auth.api';
import '../../estilos/Registro.css';

export default function RegistroPaciente() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [expediente, setExpediente] = useState('');

  async function guardar(datos) {
    setCargando(true);
    setError('');
    const respuesta = await registrarPaciente(datos);
    setCargando(false);

    if (respuesta.success) {
      setExpediente(respuesta.data.expediente);
    } else {
      setError(respuesta.message);
    }
  }

  return (
    <div className="registro-page">
      <header>
        <div className="container-logo">
          <div className="logo">Medi<span>Voz</span></div>
          <div className="subtitle">Portal de Pacientes</div>
        </div>
      </header>

      <div className="form-page">
        <div className="Formulario_Registro">
          {expediente ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <h1 className="Titulo">¡Cuenta creada!</h1>
              <p>Tu número de expediente es:</p>
              <h2 style={{ color: 'var(--primary, #0e7490)' }}>{expediente}</h2>
              <p>Ya puedes iniciar sesión como paciente para agendar tu cita.</p>
              <button className="Btn_Login" type="button" onClick={() => navigate('/login')}>
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              {error && <div className="alert-error">{error}</div>}
              <FormularioPaciente
                titulo="Crear cuenta de paciente"
                textoBoton="Crear cuenta"
                conCuenta={true}
                cargando={cargando}
                onGuardar={guardar}
                onCancelar={() => navigate('/login')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
