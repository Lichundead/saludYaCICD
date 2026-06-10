import { useNavigate } from "react-router-dom";
import { cerrarSesion } from "../services/api";

function DashboardAdmin() {
  const navigate = useNavigate();

  const medicos = [
    {
      nombre: "Carlos Rodríguez",
      correo: "medico.carlos@gmail.com",
      especialidad: "Cardiología",
      estado: "Activo",
      telefono: "3001234567"
    },
    {
      nombre: "Laura Gómez",
      correo: "medico.laura@gmail.com",
      especialidad: "Pediatría",
      estado: "Inactivo",
      telefono: "3019876543"
    }
  ];

  const fechaActual = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const fechaFormateada = fechaActual
    .replace(/(\d{4})$/, "del $1")
    .replace(/^./, letra => letra.toUpperCase());

  return (
    <div style={styles.container}>
      
      
      <div style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}></div>
          <h3>SaludYa</h3>
        </div>

        <div style={styles.activeMenu}>
          Panel de control
        </div>
      </div>

      
      <div style={styles.mainContent}>
        
        
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              Panel de Control
            </h2>

            <p style={styles.date}>
              {fechaFormateada}
            </p>
          </div>

          <button
            style={styles.logoutButton}
            onClick={() => {
              cerrarSesion();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>

        
        <div style={styles.buttonContainer}>
          <button 
            style={styles.button}
            onClick={() => navigate("/crear-medico")}
          >
           Crear cuenta médico
         </button>
        </div>

       
        <div style={styles.tableContainer}>
          <h3>Médicos registrados</h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Especialidad</th>
                <th>Estado</th>
                <th>Teléfono</th>
              </tr>
            </thead>

            <tbody>
              {medicos.map((medico, index) => (
                <tr key={index} style={styles.row}>
                  <td>{medico.nombre}</td>
                  <td>{medico.correo}</td>
                  <td>{medico.especialidad}</td>

                  <td>
                    <span
                      style={
                        medico.estado === "Activo"
                          ? styles.activeStatus
                          : styles.inactiveStatus
                      }
                    >
                      {medico.estado}
                    </span>
                  </td>

                  <td>{medico.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    background: "#FFFFFF",
    padding: "20px",
    borderRight: "1px solid #D1D5DB"
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "30px"
  },

  logo: {
    width: "40px",
    height: "40px",
    background: "#2563EB",
    borderRadius: "10px"
  },

  activeMenu: {
    background: "#E7F0FF",
    color: "#2563EB",
    padding: "12px",
    borderRadius: "8px"
  },

  mainContent: {
    flex: 1,
    padding: "24px"
  },

  header: {
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  title: {
    color: "#111827",
    marginBottom: "5px"
  },

  date: {
    color: "#6B7280",
    fontSize: "14px"
  },

  logoutButton: {
    background: "#C54D4D",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  buttonContainer: {
    marginBottom: "20px"
  },

  createButton: {
    background: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  tableContainer: {
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px"
  },

  row: {
    height: "50px",
    borderBottom: "1px solid #E5E7EB"
  },

  activeStatus: {
    background: "#D1FAE5",
    color: "#065F46",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px"
  },

  inactiveStatus: {
    background: "#FEE2E2",
    color: "#7F1D1D",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px"
  }
};

export default DashboardAdmin;
