// ROUTER DEL NAVEGADOR: qué página se muestra en cada URL.
// (El router del API está en backend/src/routes/index.js)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RutaProtegida from '../componentes/RutaProtegida';

import Login from '../paginas/auth/Login';
import Registro from '../paginas/auth/Registro';
import Agenda from '../paginas/citas/Agenda';
import AgendarCita from '../paginas/citas/AgendarCita';
import Pacientes from '../paginas/pacientes/Pacientes';
import PacienteNuevo from '../paginas/pacientes/PacienteNuevo';
import Historial from '../paginas/pacientes/Historial';
import Consulta from '../paginas/consultas/Consulta';
import Receta from '../paginas/recetas/Receta';
import Reportes from '../paginas/reportes/Reportes';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas: solo login y registro de médico */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Privadas: requieren sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Agenda />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/paciente/nuevo" element={<PacienteNuevo />} />
          <Route path="/paciente/agendar" element={<AgendarCita />} />
          <Route path="/historial/:id" element={<Historial />} />
          <Route path="/consulta" element={<Consulta />} />
          <Route path="/consulta/:id" element={<Consulta />} />
          <Route path="/receta/:id" element={<Receta />} />
          <Route path="/reportes" element={<Reportes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
