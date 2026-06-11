import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import {
  actualizarSesionUsuario,
  cambiarPassword,
  obtenerSesion,
} from "../services/api";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

const RUTAS_POR_ROL = {
  admin: "/dashboard-admin",
  medico: "/dashboard-medico",
  paciente: "/dashboard-paciente",
};

/**
 * Cambio de contraseña del usuario autenticado. Es la pantalla a la que
 * llegan las cuentas con contraseña temporal en su primer ingreso.
 */
function CambiarPassword() {
  const navigate = useNavigate();
  const usuario = obtenerSesion();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");

  const esPrimerIngreso = Boolean(usuario?.debe_cambiar_password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!actual || !nueva) {
      setError("Completa todos los campos");
      return;
    }

    if (nueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const data = await cambiarPassword(actual, nueva);

      if (data.success) {
        if (usuario) {
          actualizarSesionUsuario({ ...usuario, debe_cambiar_password: false });
        }
        alert("Contraseña actualizada correctamente");
        navigate(RUTAS_POR_ROL[usuario?.rol] || "/");
      } else {
        setError(data.message || "No se pudo cambiar la contraseña");
      }
    } catch (err) {
      console.error(err);
      setError("Error conectando con el servidor");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <KeyRound size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">
          {esPrimerIngreso ? "Define tu contraseña" : "Cambiar contraseña"}
        </h2>
        <p className="auth-subtitle">
          {esPrimerIngreso
            ? "Tu contraseña actual es temporal: crea una propia para continuar"
            : "Ingresa tu contraseña actual y la nueva"}
        </p>

        {error && <div className="auth-message auth-message--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="auth-label">
            {esPrimerIngreso ? "Contraseña temporal" : "Contraseña actual"}
          </label>
          <PasswordInput
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder={esPrimerIngreso ? "La entregada por el administrador" : ""}
          />

          <label className="auth-label">Nueva contraseña</label>
          <PasswordInput
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />

          <label className="auth-label">Confirmar nueva contraseña</label>
          <PasswordInput
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repite la contraseña"
          />

          <button type="submit" className="auth-button">
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default CambiarPassword;
