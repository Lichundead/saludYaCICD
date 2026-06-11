import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearMedico } from "../services/api";

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
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.correo || !form.password) {
      alert("Nombre, correo y contraseña son requeridos");
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
        alert("Médico creado correctamente");
        navigate("/dashboard-admin");
      } else {
        alert(data.message || "Error al crear el médico");
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* LOGO */}
        <div style={styles.logo}></div>

        {/* TÍTULO */}
        <h2 style={styles.title}>Crear cuenta médico</h2>

        <form onSubmit={handleSubmit}>

          <div style={styles.grid}>

            <div style={styles.field}>
              <label style={styles.label}>Nombre completo</label>
              <input name="nombre" onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Correo electrónico</label>
              <input name="correo" onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Número de teléfono</label>
              <input name="telefono" onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Especialidad</label>
              <select name="especialidad" onChange={handleChange} style={styles.input}>
                <option>Seleccionar</option>
                <option>Cardiología</option>
                <option>Pediatría</option>
                <option>Medicina general</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tipo de identificación</label>
              <select name="tipoId" onChange={handleChange} style={styles.input}>
                <option>Seleccionar</option>
                <option>CC</option>
                <option>TI</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Número de identificación</label>
              <input name="numeroId" onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Número de licencia médica</label>
              <input name="licencia" onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña temporal</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                style={styles.input}
              />
            </div>

          </div>

          {/* TEXTO */}
          <p style={styles.info}>
            Comparte la contraseña temporal con el médico para su primer ingreso.
          </p>

          {/* BOTONES */}
          <div style={styles.buttons}>
            <button type="submit" style={styles.primary}>
              Crear cuenta
            </button>

            <button
              type="button"
              style={styles.secondary}
              onClick={() => navigate("/dashboard-admin")}
            >
              Cancelar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "#E5E6E8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    width: "520px",
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0px 6px 20px rgba(0,0,0,0.08)"
  },

  logo: {
    width: "55px",
    height: "55px",
    background: "#2563EB",
    borderRadius: "14px",
    margin: "0 auto 12px"
  },

  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#111827"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },

  field: {
    display: "flex",
    flexDirection: "column"
  },

  label: {
    fontSize: "12px",
    color: "#6B7280",
    marginBottom: "4px"
  },

  input: {
    width: "100%",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    padding: "0 12px",
    boxSizing: "border-box",
    fontSize: "14px",
    outline: "none"
  },

  info: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "18px"
  },

  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: "20px"
  },

  primary: {
    flex: 1,
    background: "#2563EB",
    color: "#fff",
    border: "none",
    height: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  secondary: {
    flex: 1,
    background: "#E5E7EB",
    color: "#374151",
    border: "none",
    height: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500"
  }
};

export default CrearMedico;