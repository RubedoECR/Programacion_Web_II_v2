// El médico edita los datos de un paciente.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/Navbar';
import FormularioPaciente from '../../componentes/FormularioPaciente';
import { pacienteAFormulario } from '../../utils/formato';
import { obtenerPaciente, actualizarPaciente } from '../../api/pacientes.api';
import '../../estilos/Registro.css';

export default function EditarPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    obtenerPaciente(id).then((respuesta) => {
      if (respuesta.success) setPaciente(respuesta.data);
      else setError(respuesta.message);
    });
  }, [id]);

  async function guardar(datos) {
    setCargando(true);
    setError('');
    const respuesta = await actualizarPaciente(paciente._id, datos);
    setCargando(false);

    if (respuesta.success) {
      setMensaje('Datos guardados.');
      setTimeout(() => navigate('/pacientes'), 800);
    } else {
      setError(respuesta.message);
    }
  }

  return (
    <div className="registro-page">
      <Navbar />
      <div className="form-page">
        <div className="Formulario_Registro">
          {error && <div className="alert-error">{error}</div>}
          {mensaje && <div className="alert-success">{mensaje}</div>}
          {!paciente && !error && <p>Cargando paciente...</p>}
          {paciente && (
            <FormularioPaciente
              titulo={'Editar paciente · ' + paciente.expediente}
              textoBoton="Guardar cambios"
              conCuenta={false}
              valoresIniciales={pacienteAFormulario(paciente)}
              cargando={cargando}
              onGuardar={guardar}
              onCancelar={() => navigate('/pacientes')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
