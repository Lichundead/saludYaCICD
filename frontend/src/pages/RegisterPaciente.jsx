import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarPaciente } from "../services/api";

function RegisterPaciente() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipo_id: "",
    numero_id: "",
    rh: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const data = await registrarPaciente(form);

      if (data.success) {
        alert("Cuenta creada");
        navigate("/");
      } else {
        alert("Error al registrar");
      }

    } catch (error) {
      console.error(error);
      alert("Error servidor");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.logo}></div>

        <h2 style={styles.title}>Crear cuenta</h2>
        <p style={styles.subtitle}>Únete al sistema de gestión de citas</p>

        <form onSubmit={handleRegister} style={styles.grid}>

          
          <input
            name="nombre"
            placeholder="Nombre completo"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="email" 
            placeholder="Correo electrónico"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="telefono"
            placeholder="Número de teléfono"
            style={styles.input}
            onChange={handleChange}
          />

          <select name="rh" style={styles.input} onChange={handleChange}>
            <option>RH</option>
            <option>O+</option>
            <option>O-</option>
          </select>

          <select name="tipo_id" style={styles.input} onChange={handleChange}>
            <option>Tipo de identificación</option>
            <option>CC</option>
            <option>TI</option>
          </select>

          <input
            name="numero_id"
            placeholder="Número de identificación"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            style={styles.input}
            onChange={handleChange}
          />

          <input
            placeholder="Confirmar contraseña"
            style={styles.input}
          />

          <div style={styles.checkbox}>
            <input type="checkbox" />
            <span>Acepto los términos</span>
          </div>

          <button style={styles.button}>
            Crear cuenta
          </button>

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
    width: "400px",
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0px 6px 16px rgba(0,0,0,0.08)",
    textAlign: "center"
  },

  logo: {
    width: "56px",
    height: "56px",
    background: "#2F5FD0",
    borderRadius: "12px",
    margin: "0 auto 10px"
  },

  title: {
    margin: "10px 0"
  },

  subtitle: {
    fontSize: "13px",
    color: "#6B7280",
    marginBottom: "20px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  input: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    padding: "0 10px"
  },

  checkbox: {
    gridColumn: "span 2",
    fontSize: "12px"
  },

  button: {
    gridColumn: "span 2",
    height: "40px",
    background: "#2F5FD0",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
};

export default RegisterPaciente;