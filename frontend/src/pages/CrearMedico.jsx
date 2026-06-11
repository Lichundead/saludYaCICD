import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { crearMedico } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

const ESPECIALIDADES = [
  "Medicina general",
  "Cardiología",
  "Dermatología",
  "Ginecología",
  "Neurología",
  "Odontología",
  "Oftalmología",
  "Ortopedia",
  "Pediatría",
  "Psiquiatría",
];

function CrearMedico() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    especialidad: "",
    tipoId: "",
    numeroId: "",
    licencia: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.correo || !form.password) {
      setError("Nombre, correo y contraseña temporal son requeridos");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña temporal debe tener al menos 6 caracteres");
      return;
    }

    try {
      // El backend usa email/tipo_id/numero_id; el formulario, correo/tipoId/numeroId.
      const data = await crearMedico({
        nombre: form.nombre,
        email: form.correo,
        password: form.password,
        telefono: form.telefono,
        tipo_id: form.tipoId,
        numero_id: form.numeroId,
        especialidad: form.especialidad,
        licencia: form.licencia,
      });

      if (data.success) {
        alert(
          "Médico creado correctamente. Comparte la contraseña temporal: deberá cambiarla en su primer ingreso."
        );
        navigate("/dashboard-admin");
      } else {
        setError(data.message || "Error al crear el médico");
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
            <Stethoscope size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">Crear cuenta médico</h2>
        <p className="auth-subtitle">
          La cuenta se crea con una contraseña temporal que el médico deberá
          cambiar en su primer ingreso
        </p>

        {error && <div className="auth-message auth-message--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="auth-span-2">
              <label className="auth-label">Nombre completo</label>
              <input
                name="nombre"
                className="auth-input"
                value={form.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="auth-span-2">
              <label className="auth-label">Correo electrónico</label>
              <input
                name="correo"
                type="email"
                className="auth-input"
                value={form.correo}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Especialidad</label>
              <select
                name="especialidad"
                className="auth-input"
                value={form.especialidad}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                {ESPECIALIDADES.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="auth-label">Número de licencia médica</label>
              <input
                name="licencia"
                className="auth-input"
                placeholder="RM-12345"
                value={form.licencia}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Tipo de identificación</label>
              <select
                name="tipoId"
                className="auth-input"
                value={form.tipoId}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="PA">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="auth-label">Número de identificación</label>
              <input
                name="numeroId"
                className="auth-input"
                value={form.numeroId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Teléfono</label>
              <input
                name="telefono"
                className="auth-input"
                value={form.telefono}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="auth-label">Contraseña temporal</label>
              <PasswordInput
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="auth-button">
            Crear cuenta
          </button>
        </form>

        <p className="auth-footer">
          <span className="auth-link" onClick={() => navigate("/dashboard-admin")}>
            Cancelar y volver al panel
          </span>
        </p>
      </div>
    </div>
  );
}

export default CrearMedico;
