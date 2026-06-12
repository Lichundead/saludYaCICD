import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { recuperarPassword } from "../services/api";
import "../styles/auth.css";

function RecoverPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleRecover = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Ingresa tu correo");
      return;
    }

    try {
      const data = await recuperarPassword({ email });

      if (data.success) {
        setEnviado(true);
      } else {
        setError(data.message || "No se pudo procesar la solicitud");
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
          Ingresa el correo de tu cuenta y te enviaremos una contraseña temporal
        </p>

        {enviado ? (
          <>
            <div className="auth-message auth-message--success">
              Si existe una cuenta con ese correo, te enviamos una contraseña
              temporal. Revisa tu bandeja de entrada e inicia sesión con ella;
              luego podrás definir una nueva.
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
                type="email"
                className="auth-input"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button type="submit" className="auth-button">
                Enviar contraseña temporal
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
