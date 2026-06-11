import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { guardarSesion, login } from "../services/api";

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

  const handleLogin = async (e) => {
    e.preventDefault();


    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    try {
      const data = await login(email, password);

      if (data.success) {
        guardarSesion(data);
        navigate(RUTAS_POR_ROL[data.user.rol] || "/dashboard-paciente");
      } else {
        alert(data.message || "Correo o contraseña incorrectos");
      }

    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
      
        <div style={styles.logo}></div>

        
        <h2 style={styles.title}>Bienvenido</h2>

       
        <p style={styles.subtitle}>
          Sistema de gestión médica
        </p>

        <form onSubmit={handleLogin}>
          
      
          <label style={styles.label}>
            Correo electrónico
          </label>

          <input
            type="email"
            placeholder="Ingresa tu correo"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

         
          <label style={styles.label}>
            Contraseña
          </label>

          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

       
          <div style={styles.optionsRow}>
            <span
              style={styles.link}
              onClick={() => navigate("/recover")}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>

       
          <button type="submit" style={styles.button}>
            Iniciar sesión
          </button>
        </form>

     
        <p style={styles.registerText}>
          ¿No tienes cuenta?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/register-paciente")}
          >
            Regístrate aquí
          </span>
        </p>

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
    width: "360px",
    background: "#FFFFFF",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)"
  },

  logo: {
    width: "48px",
    height: "48px",
    background: "#2563EB",
    borderRadius: "12px",
    margin: "0 auto"
  },

  title: {
    textAlign: "center",
    marginTop: "12px",
    color: "#111827"
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: "13px",
    marginBottom: "20px"
  },

  label: {
    display: "block",
    marginBottom: "5px",
    color: "#6B7280",
    fontSize: "12px"
  },

  input: {
    width: "100%",
    height: "40px",
    marginBottom: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    padding: "0 12px",
    boxSizing: "border-box"
  },

  optionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: "16px",
    fontSize: "12px"
  },

  button: {
    width: "100%",
    height: "44px",
    background: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  registerText: {
    textAlign: "center",
    marginTop: "12px",
    fontSize: "12px"
  },

  link: {
    color: "#2563EB",
    cursor: "pointer"
  }
};

export default Login;