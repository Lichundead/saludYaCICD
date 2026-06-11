import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { crearCita, obtenerMedicos, obtenerSlots } from "../services/api";
import "../styles/auth.css";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-06-15" → "Lunes 15 de junio" (parseo local, sin desfase UTC). */
function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(anio, mes - 1, dia);
  return `${DIAS[d.getDay()]} ${dia} de ${MESES[mes - 1]}`;
}

function AgendarCita() {
  const navigate = useNavigate();

  const [medicos, setMedicos] = useState([]);
  const [especialidad, setEspecialidad] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [slots, setSlots] = useState({});
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerMedicos()
      .then((data) => {
        if (data.success) setMedicos(data.medicos);
      })
      .catch((err) => console.error(err));
  }, []);

  // La especialidad sale de los médicos registrados.
  const especialidades = [
    ...new Set(medicos.map((m) => m.especialidad).filter(Boolean)),
  ].sort();

  const medicosFiltrados = especialidad
    ? medicos.filter((m) => m.especialidad === especialidad)
    : medicos;

  const medicoSeleccionado = medicos.find((m) => m.id === Number(medicoId));
  const fechasDisponibles = Object.keys(slots).sort();
  const horasDisponibles = fecha ? (slots[fecha] ?? []) : [];

  const cargarSlots = async (id) => {
    setSlots({});
    setFecha("");
    setHora("");
    if (!id) return;

    try {
      const data = await obtenerSlots(id);
      if (data.success) setSlots(data.slots);
    } catch (err) {
      console.error(err);
    }
  };

  const elegirEspecialidad = (valor) => {
    setEspecialidad(valor);
    setMedicoId("");
    setSlots({});
    setFecha("");
    setHora("");
  };

  const elegirMedico = (valor) => {
    setMedicoId(valor);
    cargarSlots(valor);
  };

  const handleSubmit = async () => {
    setError("");

    if (!medicoId || !fecha || !hora) {
      setError("Selecciona médico, fecha y hora");
      return;
    }

    try {
      const data = await crearCita({
        medico_id: Number(medicoId),
        especialidad: medicoSeleccionado?.especialidad || especialidad || "General",
        fecha,
        hora,
      });

      if (data.success) {
        setConfirmado(true);
      } else {
        setError(data.message || "Error al guardar la cita");
        // El horario pudo ocuparse mientras tanto: refrescar slots.
        cargarSlots(medicoId);
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
            <CalendarPlus size={26} />
          </div>
          <span className="auth-brand__name">SaludYa</span>
        </div>

        <h2 className="auth-title">Agendar nueva cita</h2>
        <p className="auth-subtitle">
          Los horarios mostrados corresponden a la disponibilidad real del médico
        </p>

        {error && <div className="auth-message auth-message--error">{error}</div>}

        {!confirmado ? (
          <>
            <label className="auth-label">Especialidad</label>
            <select
              className="auth-input"
              value={especialidad}
              onChange={(e) => elegirEspecialidad(e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>

            <label className="auth-label">Médico</label>
            <select
              className="auth-input"
              value={medicoId}
              onChange={(e) => elegirMedico(e.target.value)}
            >
              <option value="">Selecciona un médico</option>
              {medicosFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                  {m.especialidad ? ` — ${m.especialidad}` : ""}
                </option>
              ))}
            </select>

            <label className="auth-label">Fecha disponible</label>
            <select
              className="auth-input"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHora("");
              }}
              disabled={!medicoId}
            >
              <option value="">
                {!medicoId
                  ? "Primero selecciona un médico"
                  : fechasDisponibles.length === 0
                    ? "El médico no tiene horarios disponibles"
                    : "Selecciona una fecha"}
              </option>
              {fechasDisponibles.map((f) => (
                <option key={f} value={f}>
                  {formatearFecha(f)}
                </option>
              ))}
            </select>

            <label className="auth-label">Hora disponible</label>
            <select
              className="auth-input"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={!fecha}
            >
              <option value="">
                {fecha ? "Selecciona una hora" : "Primero selecciona una fecha"}
              </option>
              {horasDisponibles.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <button className="auth-button" onClick={handleSubmit}>
              Confirmar cita
            </button>
            <p className="auth-footer">
              <span
                className="auth-link"
                onClick={() => navigate("/dashboard-paciente")}
              >
                Cancelar y volver
              </span>
            </p>
          </>
        ) : (
          <>
            <div className="auth-message auth-message--success">
              Tu cita fue agendada para el <strong>{formatearFecha(fecha)}</strong> a
              las <strong>{hora}</strong> con{" "}
              <strong>{medicoSeleccionado?.nombre}</strong>. Quedará confirmada
              cuando el médico la acepte.
            </div>
            <button
              className="auth-button"
              onClick={() => navigate("/dashboard-paciente")}
            >
              Volver al panel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AgendarCita;
