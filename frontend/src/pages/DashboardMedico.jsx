import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cerrarSesion } from "../services/api";

function DashboardMedico() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("calendario");

  const citasIniciales = [
    {
      nombre: "Paula García",
      especialidad: "Medicina general",
      fecha: "21 Abril",
      hora: "10:30",
      estado: ""
    },
    {
      nombre: "María Calderón",
      especialidad: "Pediatría",
      fecha: "25 Abril",
      hora: "11:00",
      estado: ""
    }
  ];

  const [citas, setCitas] = useState(citasIniciales);

  const aceptarCita = (index) => {
    const nuevas = [...citas];
    nuevas[index].estado = "Confirmada";
    setCitas(nuevas);
  };

  const rechazarCita = (index) => {
    const nuevas = [...citas];
    nuevas[index].estado = "Rechazada";
    setCitas(nuevas);
  };

  const dias = Array.from({ length: 30 }, (_, i) => i + 1);

  const fechaActual = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const fechaFormateada = fechaActual
    .replace(/(\d{4})$/, "del $1")
    .replace(/^./, l => l.toUpperCase());

  return (
    <div style={styles.container}>

      
      <div style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logo}></div>
          <div>
            <strong>SaludYa</strong>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>
              Sistema médico
            </p>
          </div>
        </div>

        <div
          style={vista === "calendario" ? styles.activeMenu : styles.menu}
          onClick={() => setVista("calendario")}
        >
          📅 Calendario
        </div>

        <div
          style={vista === "gestion" ? styles.activeMenu : styles.menu}
          onClick={() => setVista("gestion")}
        >
          🗂️ Gestión de citas
        </div>
      </div>

    
      <div style={styles.main}>

 
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h3 style={{ margin: 0 }}>
              {vista === "calendario"
                ? "Panel de control"
                : "Gestión de citas"}
            </h3>

            <p style={styles.date}>
              {fechaFormateada}
            </p>
          </div>

          <button
            style={styles.logout}
            onClick={() => {
              cerrarSesion();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>

      
        {vista === "calendario" && (
          <>
            <div style={styles.cards}>
              <div style={styles.cardSmall}>
                <p>Citas hoy</p>
                <h2>12</h2>
              </div>

              <div style={styles.cardSmall}>
                <p>Tiempo promedio</p>
                <h2>25 min</h2>
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.calendarBox}>
                <h4>Calendario de citas</h4>

                <div style={styles.daysHeader}>
                  {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div style={styles.calendarGrid}>
                  {dias.map((dia) => (
                    <div key={dia} style={styles.day}>
                      {dia}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.sidePanel}>
                <h4>Próximas citas</h4>

                {citas.map((cita, i) => (
                  <div key={i} style={styles.citaItem}>
                    <strong>{cita.nombre}</strong>
                    <p>{cita.fecha} - {cita.hora}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      
        {vista === "gestion" && (
          <div style={styles.tableContainer}>
            <h3>Gestión de citas</h3>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Especialidad</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th style={{ textAlign: "center" }}>Acción</th>
                </tr>
              </thead>

              <tbody>
                {citas.map((cita, i) => (
                  <tr key={i} style={styles.row}>
                    <td>{cita.nombre}</td>
                    <td>{cita.especialidad}</td>
                    <td>{cita.fecha}</td>
                    <td>{cita.hora}</td>

                    <td style={{ textAlign: "center" }}>
                      {cita.estado === "" ? (
                        <>
                          <button
                            style={styles.acceptBtn}
                            onClick={() => aceptarCita(i)}
                          >
                            Aceptar
                          </button>

                          <button
                            style={styles.rejectBtn}
                            onClick={() => rechazarCita(i)}
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span style={styles.resultado}>
                          {cita.estado}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

  activeMenu: {
    background: "#2F6FED",
    color: "#FFFFFF",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    cursor: "pointer"
  },

  menu: {
    padding: "12px",
    color: "#6B7280",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: "24px"
  },

  header: {
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  headerLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  date: {
    color: "#6B7280",
    fontSize: "13px",
    marginTop: "4px"
  },

  logout: {
    color: "#EF4444",
    background: "transparent",
    border: "none",
    cursor: "pointer"
  },

  cards: {
    display: "flex",
    gap: "16px",
    margin: "20px 0"
  },

  cardSmall: {
    background: "#FFFFFF",
    padding: "16px",
    borderRadius: "10px",
    width: "150px"
  },

  grid: {
    display: "flex",
    gap: "20px"
  },

  calendarBox: {
    flex: 3,
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px"
  },

  daysHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "10px",
    color: "#6B7280"
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px"
  },

  day: {
    height: "40px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  sidePanel: {
    flex: 1,
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px"
  },

  citaItem: {
    marginBottom: "15px"
  },

  tableContainer: {
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  },

  row: {
    borderBottom: "1px solid #E5E7EB"
  },

  acceptBtn: {
    background: "#22C55E",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    marginRight: "5px",
    cursor: "pointer"
  },

  rejectBtn: {
    background: "#EF4444",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  resultado: {
    fontWeight: "bold"
  }
};

export default DashboardMedico;
