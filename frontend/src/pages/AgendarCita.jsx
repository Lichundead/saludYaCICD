import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearCita, obtenerMedicos, obtenerSesion } from "../services/api";

function AgendarCita() {
  const navigate = useNavigate();

  const [medicos, setMedicos] = useState([]);
  const [especialidad, setEspecialidad] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    obtenerMedicos()
      .then((data) => {
        if (data.success) setMedicos(data.medicos);
      })
      .catch((err) => console.error(err));
  }, []);

  const medicoSeleccionado = medicos.find((m) => m.id === Number(medicoId));

  const handleSubmit = async () => {
  const usuario = obtenerSesion();

  if (!usuario) {
    alert("Error: usuario no identificado");
    return;
  }

    if (!especialidad || !medicoId || !fecha || !hora) {
      alert("Completa todos los campos");
      return;
    }

    // Se interpreta la fecha como local: new Date("YYYY-MM-DD") la tomaría
    // como UTC y en Colombia (UTC-5) correría el día de la semana.
    const [anio, mes, diaMes] = fecha.split("-").map(Number);
    const diaSemana = new Date(anio, mes - 1, diaMes).getDay();

    if (diaSemana === 0 || diaSemana === 6) {
      alert("No hay citas disponibles los fines de semana");
      return;
    }

    const nuevaCita = {
      medico_id: Number(medicoId),
      especialidad,
      fecha,
      hora
    };

    try {
      const data = await crearCita(nuevaCita);

      if (data.success) {
        setConfirmado(true);
      } else {
        alert(data.message || "Error al guardar cita");
      }

    } catch (error) {
      console.error(error);
      alert("Error con el servidor");
    }
  }
  return (
    <div style={styles.container}>
      <div style={styles.card}>

   
        <div style={styles.logo}></div>

        <h2 style={styles.title}>Agendar nueva cita</h2>

        <div style={styles.grid}>

       
          <select
            style={styles.input}
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
          >
            <option value="">Especialidad</option>
            <option>Medicina general</option>
            <option>Odontología</option>
            <option>Pediatría</option>
          </select>

         
          <select
            style={styles.input}
            value={medicoId}
            onChange={(e) => setMedicoId(e.target.value)}
          >
            <option value="">Médico</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
                {m.especialidad ? ` — ${m.especialidad}` : ""}
              </option>
            ))}
          </select>


          <input
            type="date"
            style={styles.input}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

    
          <select
            style={styles.input}
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          >
            <option value="">Selecciona hora</option>
            <option>08:00</option>
            <option>08:30</option>
            <option>09:00</option>
            <option>09:30</option>
            <option>10:00</option>
            <option>10:30</option>
            <option>11:00</option>
            <option>11:30</option>
            <option>14:00</option>
            <option>14:30</option>
            <option>15:00</option>
            <option>15:30</option>
            <option>16:00</option>
          </select>

        </div>

        
        {!confirmado ? (
          <div style={styles.buttons}>
            <button
              style={styles.cancel}
              onClick={() => navigate("/dashboard-paciente")}
            >
              Cancelar
            </button>

            <button
              style={styles.confirm}
              onClick={handleSubmit}
            >
              Confirmar
            </button>
          </div>
        ) : (
          <>
           
            <div style={styles.success}>
              Tu cita fue agendada para el <strong>{fecha}</strong> a las{" "}
              <strong>{hora}</strong> con{" "}
              <strong>{medicoSeleccionado?.nombre}</strong>.
            </div>

            <button
              style={styles.confirm}
              onClick={() => navigate("/dashboard-paciente")}
            >
              Volver
            </button>
          </>
        )}

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
    width: "600px",
    background: "#FFFFFF",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0px 6px 16px rgba(0,0,0,0.08)",
    textAlign: "center"
  },

  logo: {
    width: "56px",
    height: "56px",
    background: "#2F5FD0",
    borderRadius: "12px",
    margin: "0 auto 12px"
  },

  title: {
    marginBottom: "24px",
    color: "#111827"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "24px"
  },

  input: {
    height: "44px",
    borderRadius: "10px",
    border: "none",
    background: "#F3F4F6",
    padding: "0 12px"
  },

  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "24px"
  },

  cancel: {
    background: "#6B7280",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer"
  },

  confirm: {
    background: "#2F5FD0",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "10px"
  },

  success: {
    background: "#DCFCE7",
    color: "#166534",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px"
  }
};

export default AgendarCita;