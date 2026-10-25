import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RutaProtegida from './auth/RutaProtegida';
import Login from './paginas/Login';
import LoginPaciente from './paginas/LoginPaciente';
import Registro from './paginas/Registro';
import RegistroPaciente from './paginas/RegistroPaciente';
import Dashboard from './paginas/Dashboard';
import Dashboard1 from './paginas/dashboard1';
import PacienteNuevo from './paginas/PacienteNuevo';
import AgendarCita from './paginas/AgendarCita';
import Consulta from './paginas/Consulta';
import Historial from './paginas/Historial';
import Receta from './paginas/Receta';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-paciente" element={<LoginPaciente />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro-paciente" element={<RegistroPaciente />} />
          <Route path="/dashboard" element={
            <RutaProtegida rolPermitido="medico">
              <Dashboard1 />
            </RutaProtegida>
          } />
          <Route path="/dashboard1" element={
            <RutaProtegida rolPermitido="medico">
              <Dashboard1 />
            </RutaProtegida>
          } />
          <Route path="/pacientes" element={
            <RutaProtegida rolPermitido="medico">
              <Dashboard />
            </RutaProtegida>
          } />
          <Route path="/paciente/nuevo" element={<PacienteNuevo />} />
          <Route path="/paciente/agendar" element={<AgendarCita />} />
          <Route path="/consulta/:id" element={<Consulta />} />
          <Route path="/historial/:id" element={<Historial />} />
          <Route path="/receta/:id" element={<Receta />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
