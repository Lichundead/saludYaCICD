import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cerrarSesion, obtenerCitas, obtenerSesion } from "../services/api";

function DashboardPaciente() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);

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

  
useEffect(() => {
  const usuario = obtenerSesion();

  if (!usuario) return;

  obtenerCitas(usuario.email)
    .then((data) => {
      if (data.success) {
        setCitas(data.citas);
      }
    })
    .catch((err) => console.error(err));
}, []);
  
  // Días del mes actual con cita. La fecha "YYYY-MM-DD" se parsea como texto:
  // new Date() la interpretaría como UTC y marcaría el día anterior en UTC-5.
  const hoy = new Date();
  const diasConCitas = citas
    .filter((c) => {
      const [anio, mes] = String(c.fecha).split("-").map(Number);
      return anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
    })
    .map((c) => Number(String(c.fecha).split("-")[2]));

  return (
    <div style={styles.container}>

      <div style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logo}></div>
          <div>
            <strong>SaludYa</strong>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>
              Paciente
            </p>
          </div>
        </div>

        <div style={styles.activeMenu}>🏠 Inicio</div>
        <div style={styles.menu} onClick={() => navigate("/perfil")}>
          👤 Perfil
        </div>
      </div>

     
      <div style={styles.main}>

        
        <div style={styles.header}>
          <div>
            <h3>Panel del paciente</h3>
            <p style={styles.date}>{fechaFormateada}</p>
          </div>

          <span
            style={styles.logout}
            onClick={() => {
              cerrarSesion();
              navigate("/");
            }}
          >
            Cerrar sesión
          </span>
        </div>

     
        <button
          style={styles.agendarBtn}
          onClick={() => navigate("/agendar-cita")}
        >
          + Agendar cita
        </button>

      
        <div style={styles.grid}>

        
          <div style={styles.calendarBox}>
            <h4>Calendario de citas</h4>

            <div style={styles.daysHeader}>
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              {dias.map(dia => {

                const tieneCita = diasConCitas.includes(dia);

                return (
                  <div
                    key={dia}
                    style={{
                      ...styles.day,
                      background: tieneCita ? "#D1D5DB" : "#fff"
                    }}
                  >
                    {dia}
                  </div>
                );
              })}
            </div>
          </div>

        
          <div style={styles.sidePanel}>
            <h4>Próximas citas</h4>

            {citas.length === 0 ? (
              <p>No tienes citas aún 😴</p>
            ) : (
              citas.map((cita, i) => (
                <div key={i} style={styles.citaItem}>
                  <strong>{cita.medico}</strong>
                  <p>{cita.especialidad}</p>
                  <p>{cita.fecha} - {cita.hora}</p>

                  <span
                    style={{
                      ...styles.badge,
                      ...(cita.estado === "confirmada"
                        ? {}
                        : { background: "#FEF3C7", color: "#92400E" }),
                    }}
                  >
                    {cita.estado
                      ? cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)
                      : "Pendiente"}
                  </span>
                </div>
              ))
            )}

          </div>

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
    padding: "20px"
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
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px"
  },

  menu: {
    padding: "12px",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: "24px"
  },

  header: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between"
  },

  date: {
    color: "#6B7280"
  },

  logout: {
    color: "red",
    cursor: "pointer"
  },

  agendarBtn: {
    marginTop: "20px",
    background: "#2563EB",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  grid: {
    display: "flex",
    gap: "20px",
    marginTop: "20px"
  },

  calendarBox: {
    flex: 3,
    background: "#fff",
    padding: "20px",
    borderRadius: "12px"
  },

  daysHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    marginBottom: "10px"
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
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
    background: "#fff",
    padding: "20px",
    borderRadius: "12px"
  },

  citaItem: {
    marginBottom: "15px"
  },

  badge: {
    background: "#D1FAE5",
    color: "#065F46",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px"
  }
};

export default DashboardPaciente;