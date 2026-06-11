import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { recuperarPassword } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

function RecoverPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    numero_id: "",
    password: "",
    confirmar: "",
  });
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.numero_id || !form.password) {
      setError("Completa todos los campos");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const { confirmar, ...datos } = form;
      const data = await recuperarPassword(datos);

      if (data.success) {
        setExito(true);
      } else {
        setError(data.message || "No se pudo restablecer la contraseña");
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
            <LockKeyhole size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">Recuperar contraseña</h2>
        <p className="auth-subtitle">
          Verifica tu identidad con el correo y tu número de identificación
        </p>

        {exito ? (
          <>
            <div className="auth-message auth-message--success">
              Tu contraseña fue restablecida correctamente.
            </div>
            <button className="auth-button" onClick={() => navigate("/")}>
              Ir a iniciar sesión
            </button>
          </>
        ) : (
          <>
            {error && (
              <div className="auth-message auth-message--error">{error}</div>
            )}

            <form onSubmit={handleRecover}>
              <label className="auth-label">Correo electrónico</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                placeholder="Ingresa tu correo"
                value={form.email}
                onChange={handleChange}
              />

              <label className="auth-label">Número de identificación</label>
              <input
                name="numero_id"
                className="auth-input"
                placeholder="El registrado en tu cuenta"
                value={form.numero_id}
                onChange={handleChange}
              />

              <label className="auth-label">Nueva contraseña</label>
              <PasswordInput
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
              />

              <label className="auth-label">Confirmar nueva contraseña</label>
              <PasswordInput
                name="confirmar"
                placeholder="Repite la contraseña"
                value={form.confirmar}
                onChange={handleChange}
              />

              <button type="submit" className="auth-button">
                Restablecer contraseña
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <span className="auth-link" onClick={() => navigate("/")}>
            Volver al inicio de sesión
          </span>
        </p>
      </div>
    </div>
  );
}

export default RecoverPassword;
