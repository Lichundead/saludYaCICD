import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { registrarPaciente } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

const TIPOS_SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function RegisterPaciente() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipo_id: "",
    numero_id: "",
    rh: "",
    password: "",
    confirmar: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.email || !form.password) {
      setError("Nombre, correo y contraseña son requeridos");
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

    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    try {
      const { confirmar, ...datos } = form;
      const data = await registrarPaciente(datos);

      if (data.success) {
        alert("Cuenta creada. Ahora puedes iniciar sesión.");
        navigate("/");
      } else {
        setError(data.message || "Error al registrar");
      }
    } catch (err) {
      console.error(err);
      setError("Error conectando con el servidor");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <HeartPulse size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">Crear cuenta</h2>
        <p className="auth-subtitle">Únete al sistema de gestión de citas</p>

        {error && <div className="auth-message auth-message--error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="auth-grid">
            <div className="auth-span-2">
              <label className="auth-label">Nombre completo</label>
              <input
                name="nombre"
                className="auth-input"
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="auth-span-2">
              <label className="auth-label">Correo electrónico</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Teléfono</label>
              <input
                name="telefono"
                className="auth-input"
                placeholder="3001234567"
                value={form.telefono}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Tipo de sangre (RH)</label>
              <select
                name="rh"
                className="auth-input"
                value={form.rh}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                {TIPOS_SANGRE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="auth-label">Tipo de identificación</label>
              <select
                name="tipo_id"
                className="auth-input"
                value={form.tipo_id}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="PA">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="auth-label">Número de identificación</label>
              <input
                name="numero_id"
                className="auth-input"
                placeholder="1090123456"
                value={form.numero_id}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Contraseña</label>
              <PasswordInput
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Confirmar contraseña</label>
              <PasswordInput
                name="confirmar"
                placeholder="Repite la contraseña"
                value={form.confirmar}
                onChange={handleChange}
              />
            </div>
          </div>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            <span>Acepto los términos y condiciones del servicio</span>
          </label>

          <button type="submit" className="auth-button" disabled={!aceptaTerminos}>
            Crear cuenta
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{" "}
          <span className="auth-link" onClick={() => navigate("/")}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  );
}

export default RegisterPaciente;
