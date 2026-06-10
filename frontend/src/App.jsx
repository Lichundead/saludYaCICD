import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RutaProtegida from "./components/RutaProtegida";

import Login from "./pages/Login";
import RecoverPassword from "./pages/RecoverPassword";
import RegisterPaciente from "./pages/RegisterPaciente";

import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardMedico from "./pages/DashboardMedico";
import DashboardPaciente from "./pages/DashboardPaciente";

import CrearMedico from "./pages/CrearMedico";
import AgendarCita from "./pages/AgendarCita";
import PerfilPaciente from "./pages/PerfilPaciente";

/** Rutas que requieren sesión iniciada, con su componente. */
const rutasProtegidas = [
  ["/dashboard-admin", DashboardAdmin],
  ["/crear-medico", CrearMedico],
  ["/dashboard-medico", DashboardMedico],
  ["/dashboard-paciente", DashboardPaciente],
  ["/agendar-cita", AgendarCita],
  ["/perfil", PerfilPaciente],
];

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/register-paciente" element={<RegisterPaciente />} />

        {rutasProtegidas.map(([path, Pagina]) => (
          <Route
            key={path}
            path={path}
            element={
              <RutaProtegida>
                <Pagina />
              </RutaProtegida>
            }
          />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
