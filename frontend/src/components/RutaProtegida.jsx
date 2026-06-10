import { Navigate } from "react-router-dom";
import { haySesion } from "../services/api";

/**
 * Envuelve las rutas que requieren sesión iniciada: si no hay token,
 * redirige a la pantalla de inicio de sesión.
 */
function RutaProtegida({ children }) {
  if (!haySesion()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RutaProtegida;
