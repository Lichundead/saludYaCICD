import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesion } from "../services/api";

function PerfilPaciente() {
  const navigate = useNavigate();

  const [editando, setEditando] = useState(false);

  const [datos, setDatos] = useState({
    nombre: "",
    correo: "",
    telefono: ""
  });

  useEffect(() => {
    const user = obtenerSesion();
    if (user) setDatos(user);
  }, []);

  const handleChange = (e) => {
    setDatos({
      ...datos,
      [e.target.name]: e.target.value
    });
  };

  const guardarDatos = () => {
    localStorage.setItem("usuario", JSON.stringify(datos));
    setEditando(false);
  };

  return (
    <div style={styles.container}>

    
      <div style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logo}></div>
          <div>
            <strong>SaludYa</strong>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>
              Sistema pacientes
            </p>
          </div>
        </div>

        <div
          style={styles.menu}
          onClick={() => navigate("/dashboard-paciente")}
        >
          🏠 Inicio
        </div>

        <div style={styles.activeMenu}>👤 Perfil</div>
      </div>

      
      <div style={styles.main}>
        <div style={styles.card}>

          <h3>Perfil</h3>

          <div style={styles.formGrid}>
            <input
              name="nombre"
              value={datos.nombre}
              onChange={handleChange}
              disabled={!editando}
              style={styles.input}
            />

            <input
              name="correo"
              value={datos.correo}
              onChange={handleChange}
              disabled={!editando}
              style={styles.input}
            />

            <input
              name="telefono"
              value={datos.telefono}
              onChange={handleChange}
              disabled={!editando}
              style={styles.input}
            />
          </div>

          {!editando ? (
            <button onClick={() => setEditando(true)}>
              Editar
            </button>
          ) : (
            <>
              <button onClick={guardarDatos}>
                Guardar cambios
              </button>

              <button onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </>
          )}

          <br /><br />

          <button onClick={() => navigate("/dashboard-paciente")}>
            Volver
          </button>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#E5E6E8"
  },

  sidebar: {
    width: "220px",
    background: "#fff",
    padding: "20px",
    borderRight: "1px solid #D1D5DB"
  },

  logoBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px"
  },

  logo: {
    width: "40px",
    height: "40px",
    background: "#2563EB",
    borderRadius: "10px"
  },

  menu: {
    padding: "12px",
    color: "#6B7280",
    cursor: "pointer"
  },

  activeMenu: {
    background: "#2F6FED",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px"
  },

  main: {
    flex: 1,
    padding: "24px"
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px"
  },

  formGrid: {
    display: "grid",
    gap: "12px"
  },

  input: {
    height: "40px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    padding: "0 12px"
  }
};

export default PerfilPaciente;
