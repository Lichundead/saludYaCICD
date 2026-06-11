import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { guardarSesion, login } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

/** Dashboard inicial según el rol que devuelve el backend. */
const RUTAS_POR_ROL = {
  admin: "/dashboard-admin",
  medico: "/dashboard-medico",
  paciente: "/dashboard-paciente",
};

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    try {
      const data = await login(email, password);

      if (data.success) {
        guardarSesion(data);

        // Cuentas con contraseña temporal: definir la propia antes de entrar.
        if (data.user.debe_cambiar_password) {
          navigate("/cambiar-password");
          return;
        }

        navigate(RUTAS_POR_ROL[data.user.rol] || "/dashboard-paciente");
      } else {
        setError(data.message || "Correo o contraseña incorrectos");
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
            <HeartPulse size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">Bienvenido</h2>
        <p className="auth-subtitle">Sistema de gestión de citas médicas</p>

        {error && <div className="auth-message auth-message--error">{error}</div>}

        <form onSubmit={handleLogin}>
          <label className="auth-label">Correo electrónico</label>
          <input
            type="email"
            className="auth-input"
            placeholder="Ingresa tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="auth-label">Contraseña</label>
          <PasswordInput
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="auth-options">
            <span className="auth-link" onClick={() => navigate("/recover")}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button type="submit" className="auth-button">
            Iniciar sesión
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{" "}
          <span className="auth-link" onClick={() => navigate("/register-paciente")}>
            Regístrate aquí
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
