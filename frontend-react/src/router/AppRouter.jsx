// ROUTER DEL NAVEGADOR: qué página se muestra en cada URL.
// (El router del API está en backend/src/routes/index.js)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RutaProtegida from '../componentes/RutaProtegida';
import { INICIO } from '../utils/rutas';
import { useAuth } from '../context/useAuth';

// Públicas
import Login from '../paginas/auth/Login';
import Registro from '../paginas/auth/Registro';
import RegistroPaciente from '../paginas/auth/RegistroPaciente';

// Médico
import Agenda from '../paginas/citas/Agenda';
import Consulta from '../paginas/consultas/Consulta';
import EditarConsulta from '../paginas/consultas/EditarConsulta';
import Pacientes from '../paginas/pacientes/Pacientes';
import EditarPaciente from '../paginas/pacientes/EditarPaciente';
import Historial from '../paginas/pacientes/Historial';
import Receta from '../paginas/recetas/Receta';
import Reportes from '../paginas/reportes/Reportes';
import Medicamentos from '../paginas/medicamentos/Medicamentos';
import MiPerfil from '../paginas/auth/MiPerfil';

// Paciente
import AgendarCita from '../paginas/portal/AgendarCita';
import MisCitas from '../paginas/portal/MisCitas';

// "/" manda a la página de inicio según quién inició sesión
function Inicio() {
  const { rol } = useAuth();
  return <Navigate to={INICIO[rol] || '/login'} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro-paciente" element={<RegistroPaciente />} />

        {/* Solo médicos */}
        <Route element={<RutaProtegida rol="medico" />}>
          <Route path="/dashboard" element={<Agenda />} />
          <Route path="/consulta" element={<Consulta />} />
          <Route path="/consulta/:id" element={<Consulta />} />
          <Route path="/consultas/:id/editar" element={<EditarConsulta />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/:id/editar" element={<EditarPaciente />} />
          <Route path="/historial/:id" element={<Historial />} />
          <Route path="/receta/:id" element={<Receta />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
        </Route>

        {/* Solo pacientes */}
        <Route element={<RutaProtegida rol="paciente" />}>
          <Route path="/portal/agendar" element={<AgendarCita />} />
          <Route path="/portal/mis-citas" element={<MisCitas />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
