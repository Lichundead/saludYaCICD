import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RutaProtegida from "./components/RutaProtegida";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import "./styles/auth.css";

// Carga diferida por ruta: cada vista viaja en su propio chunk, así la
// pantalla de inicio de sesión no descarga el código de los dashboards.
const Login = lazy(() => import("./pages/Login"));
const RecoverPassword = lazy(() => import("./pages/RecoverPassword"));
const RegisterPaciente = lazy(() => import("./pages/RegisterPaciente"));
const CambiarPassword = lazy(() => import("./pages/CambiarPassword"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));
const DashboardMedico = lazy(() => import("./pages/DashboardMedico"));
const DashboardPaciente = lazy(() => import("./pages/DashboardPaciente"));
const CrearMedico = lazy(() => import("./pages/CrearMedico"));
const AgendarCita = lazy(() => import("./pages/AgendarCita"));
const PerfilPaciente = lazy(() => import("./pages/PerfilPaciente"));

/** Rutas que requieren sesión iniciada, con su componente. */
const rutasProtegidas = [
  ["/cambiar-password", CambiarPassword],
  ["/dashboard-admin", DashboardAdmin],
  ["/crear-medico", CrearMedico],
  ["/dashboard-medico", DashboardMedico],
  ["/dashboard-paciente", DashboardPaciente],
  ["/agendar-cita", AgendarCita],
  ["/perfil", PerfilPaciente],
];

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
