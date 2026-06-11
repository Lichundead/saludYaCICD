import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Home,
  LogOut,
  User,
} from "lucide-react";
import { cerrarSesion, obtenerCitas, obtenerSesion } from "../services/api";
import "../styles/dashboard.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADOS_UI = {
  pendiente: { label: "Pendiente", badge: "status--pending", dot: "cal-dot--pending" },
  confirmada: { label: "Confirmada", badge: "status--confirmed", dot: "cal-dot--confirmed" },
  rechazada: { label: "Rechazada", badge: "status--rejected", dot: "cal-dot--rejected" },
  atendida: { label: "Atendida", badge: "status--done", dot: "cal-dot--done" },
};

const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

function DashboardPaciente() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);

  const ahora = new Date();
  const [calMes, setCalMes] = useState(ahora.getMonth());
  const [calAnio, setCalAnio] = useState(ahora.getFullYear());

  useEffect(() => {
    const usuario = obtenerSesion();
    if (!usuario) return;

    obtenerCitas(usuario.email)
      .then((data) => {
        if (data.success) setCitas(data.citas);
      })
      .catch((err) => console.error(err));
  }, []);

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  const hoyStr = hoyISO();

  // Próximas citas: desde hoy, no rechazadas, ordenadas.
  const proximas = citas
    .filter((c) => c.fecha >= hoyStr && c.estado !== "rechazada")
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));

  // ── Calendario ──
  const citasPorDia = {};
  for (const cita of citas) {
    (citasPorDia[cita.fecha] ??= []).push(cita);
  }

  const primeraCasilla = new Date(calAnio, calMes, 1).getDay();
  const diasDelMes = new Date(calAnio, calMes + 1, 0).getDate();
  const fechaISO = (dia) =>
    `${calAnio}-${String(calMes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const mesAnterior = () => {
    if (calMes === 0) {
      setCalMes(11);
      setCalAnio(calAnio - 1);
    } else {
      setCalMes(calMes - 1);
    }
  };

  const mesSiguiente = () => {
    if (calMes === 11) {
      setCalMes(0);
      setCalAnio(calAnio + 1);
    } else {
      setCalMes(calMes + 1);
    }
  };

  const fechaHeader = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="panel-app">
      <aside className="panel-sidebar">
        <div className="panel-sidebar__brand">
          <div className="panel-sidebar__logo">
            <HeartPulse size={18} />
          </div>
          <div className="panel-sidebar__title">
            <h1>SaludYa</h1>
            <span>Paciente</span>
          </div>
        </div>

        <nav className="panel-sidebar__nav">
          <button className="panel-sidebar__link panel-sidebar__link--active">
            <Home size={16} />
            <span>Inicio</span>
          </button>
          <button
            className="panel-sidebar__link"
            onClick={() => navigate("/perfil")}
          >
            <User size={16} />
            <span>Perfil</span>
          </button>
        </nav>
      </aside>

      <main className="panel-main">
        <header className="panel-header">
          <div className="panel-header__top">
            <div className="panel-header__info">
              <h2>Panel del paciente</h2>
              <p>{fechaHeader.charAt(0).toUpperCase() + fechaHeader.slice(1)}</p>
            </div>
            <button className="panel-header__logout" onClick={salir}>
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <div>
          <button
            className="btn-confirm"
            onClick={() => navigate("/agendar-cita")}
          >
            <CalendarPlus size={14} /> Agendar cita
          </button>
        </div>

        <div className="panel-content">
          <section className="citas-calendario">
            <div className="citas-cal__nav">
              <button className="calendar__nav-btn" onClick={mesAnterior}>
                <ChevronLeft size={15} />
              </button>
              <span className="citas-cal__mes-label">
                {MESES[calMes]} {calAnio}
              </span>
              <button className="calendar__nav-btn" onClick={mesSiguiente}>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="citas-cal__grid-labels">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                <div key={d} className="citas-cal__label">
                  {d}
                </div>
              ))}
            </div>

            <div className="citas-cal__grid">
              {Array.from({ length: primeraCasilla }, (_, i) => (
                <div key={`vacio-${i}`} className="cal-day cal-day--empty" />
              ))}

              {Array.from({ length: diasDelMes }, (_, i) => {
                const dia = i + 1;
                const fecha = fechaISO(dia);
                const citasDia = citasPorDia[fecha] ?? [];
                const esHoy = fecha === hoyStr;

                return (
                  <div
                    key={fecha}
                    className={`cal-day${esHoy ? " cal-day--today" : ""}`}
                  >
                    <span className="cal-day__num">{dia}</span>
                    {citasDia.length > 0 && (
                      <span className="cal-day__dots">
                        {citasDia.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className={`cal-dot ${ESTADOS_UI[c.estado]?.dot ?? ""}`}
                          />
                        ))}
                        {citasDia.length > 3 && (
                          <span className="cal-dot__more">
                            +{citasDia.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="agenda-hoy">
            <h3>Próximas citas</h3>

            {proximas.length === 0 ? (
              <p className="empty-state">No tienes citas próximas</p>
            ) : (
              proximas.map((cita) => (
                <div key={cita.id} className="cita-row">
                  <div>
                    <div className="cita-row__patient">{cita.medico}</div>
                    <div className="cita-row__details">
                      {cita.especialidad}
                      <br />
                      {cita.fecha} · {cita.hora}
                    </div>
                  </div>
                  <span
                    className={`status-badge ${ESTADOS_UI[cita.estado]?.badge ?? ""}`}
                  >
                    {ESTADOS_UI[cita.estado]?.label ?? cita.estado}
                  </span>
                </div>
              ))
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default DashboardPaciente;
