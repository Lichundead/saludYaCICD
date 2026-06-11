import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  LogOut,
  Stethoscope,
  X,
} from "lucide-react";
import {
  actualizarEstadoCita,
  cerrarSesion,
  obtenerSesion,
  obtenerTodasLasCitas,
} from "../services/api";
import "../styles/dashboard-medico.css";

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

const FILTROS = [
  ["todas", "Todas"],
  ["pendiente", "Pendientes"],
  ["confirmada", "Confirmadas"],
  ["rechazada", "Rechazadas"],
  ["atendida", "Atendidas"],
];

/** Fecha local de Colombia en formato YYYY-MM-DD. */
const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

/** "2026-06-15" + "10:30" → "15 Jun · 10:30" */
function formatearFechaCorta(fecha, hora) {
  const [, mes, dia] = fecha.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} ${MESES[mes - 1].slice(0, 3)} · ${hora}`;
}

/** "2026-06-15" → "15 de Junio 2026" */
function formatearFechaLarga(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} ${anio}`;
}

function Badge({ estado }) {
  const ui = ESTADOS_UI[estado] ?? { label: estado, badge: "" };
  return <span className={`status-badge ${ui.badge}`}>{ui.label}</span>;
}

function DashboardMedico() {
  const navigate = useNavigate();
  const usuario = obtenerSesion();

  const [citas, setCitas] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [filtro, setFiltro] = useState("todas");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const ahora = new Date();
  const [calMes, setCalMes] = useState(ahora.getMonth());
  const [calAnio, setCalAnio] = useState(ahora.getFullYear());

  useEffect(() => {
    obtenerTodasLasCitas()
      .then((data) => {
        if (data.success) setCitas(data.citas);
      })
      .catch((err) => console.error(err));
  }, []);

  const cambiarEstado = async (cita, estado) => {
    try {
      const data = await actualizarEstadoCita(cita.id, estado);

      if (data.success) {
        // Merge para conservar paciente_nombre, que el PATCH no devuelve.
        setCitas((actuales) =>
          actuales.map((c) => (c.id === cita.id ? { ...c, ...data.cita } : c))
        );
      } else {
        alert(data.message || "No se pudo actualizar la cita");
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  // ── Datos derivados ──
  const hoyStr = hoyISO();

  const stats = {
    hoy: citas.filter(
      (c) => c.fecha === hoyStr && ["pendiente", "confirmada"].includes(c.estado)
    ).length,
    pendientes: citas.filter((c) => c.estado === "pendiente").length,
    confirmadas: citas.filter((c) => c.estado === "confirmada").length,
  };

  const solicitudes = citas
    .filter((c) => c.estado === "pendiente")
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));

  const agendaHoy = citas
    .filter(
      (c) => c.fecha === hoyStr && ["pendiente", "confirmada"].includes(c.estado)
    )
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // ── Calendario ──
  const citasFiltradas =
    filtro === "todas" ? citas : citas.filter((c) => c.estado === filtro);

  const citasPorDia = {};
  for (const cita of citasFiltradas) {
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

  const citasDelDia = diaSeleccionado
    ? (citasPorDia[diaSeleccionado] ?? [])
        .slice()
        .sort((a, b) => a.hora.localeCompare(b.hora))
    : [];

  const fechaHeader = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="medico-app">
      <aside className="medico-sidebar">
        <div className="medico-sidebar__brand">
          <div className="medico-sidebar__logo">
            <Stethoscope size={18} />
          </div>
          <div className="medico-sidebar__title">
            <h1>SaludYa</h1>
            <span>Panel médico</span>
          </div>
        </div>

        <nav className="medico-sidebar__nav">
          <button
            className={`medico-sidebar__link ${vista === "inicio" ? "medico-sidebar__link--active" : ""}`}
            onClick={() => setVista("inicio")}
          >
            <Home size={16} />
            <span>Inicio</span>
          </button>
          <button
            className={`medico-sidebar__link ${vista === "citas" ? "medico-sidebar__link--active" : ""}`}
            onClick={() => setVista("citas")}
          >
            <CalendarCheck size={16} />
            <span>Gestión de Citas</span>
          </button>
        </nav>
      </aside>

      <main className="medico-main">
        <header className="medico-header">
          <div className="medico-header__top">
            <div className="medico-header__info">
              <h2>{vista === "inicio" ? "Panel médico" : "Gestión de Citas"}</h2>
              <p>
                {fechaHeader.charAt(0).toUpperCase() + fechaHeader.slice(1)}
                {usuario?.nombre ? ` · ${usuario.nombre}` : ""}
              </p>
            </div>
            <button className="medico-header__logout" onClick={salir}>
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-card--blue">
              <div className="stat-card__icon">
                <Calendar size={22} />
              </div>
              <div>
                <div className="stat-card__value">{stats.hoy}</div>
                <div className="stat-card__label">Citas hoy</div>
              </div>
            </div>
            <div className="stat-card stat-card--amber">
              <div className="stat-card__icon">
                <Clock size={22} />
              </div>
              <div>
                <div className="stat-card__value">{stats.pendientes}</div>
                <div className="stat-card__label">Pendientes</div>
              </div>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-card__icon">
                <CheckCircle size={22} />
              </div>
              <div>
                <div className="stat-card__value">{stats.confirmadas}</div>
                <div className="stat-card__label">Confirmadas</div>
              </div>
            </div>
          </div>
        </header>

        {vista === "inicio" && (
          <div className="medico-content">
            <section className="solicitudes">
              <h3>Solicitudes pendientes</h3>

              {solicitudes.length === 0 ? (
                <p className="empty-state">No hay solicitudes pendientes</p>
              ) : (
                solicitudes.map((cita) => (
                  <div key={cita.id} className="solicitud-card">
                    <div className="solicitud-card__nombre">
                      {cita.paciente_nombre || cita.paciente_email}
                    </div>
                    <div className="solicitud-card__info">
                      {cita.especialidad} · {formatearFechaCorta(cita.fecha, cita.hora)}
                    </div>
                    <div className="solicitud-card__actions">
                      <button
                        className="btn-confirm"
                        onClick={() => cambiarEstado(cita, "confirmada")}
                      >
                        <Check size={13} /> Confirmar
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => cambiarEstado(cita, "rechazada")}
                      >
                        <X size={13} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <aside className="agenda-hoy">
              <h3>Agenda del día</h3>

              {agendaHoy.length === 0 ? (
                <p className="empty-state">Sin citas para hoy</p>
              ) : (
                agendaHoy.map((cita) => (
                  <div key={cita.id} className="agenda-item">
                    <span className="agenda-item__time">{cita.hora}</span>
                    <div className="agenda-item__body">
                      <div className="agenda-item__name">
                        {cita.paciente_nombre || cita.paciente_email}
                      </div>
                      <div className="agenda-item__esp">{cita.especialidad}</div>
                    </div>
                    <Badge estado={cita.estado} />
                  </div>
                ))
              )}
            </aside>
          </div>
        )}

        {vista === "citas" && (
          <section className="citas-calendario">
            <div className="citas-cal__header">
              <h3>Gestión de Citas</h3>
              <div className="filter-tabs">
                {FILTROS.map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    data-filter={valor}
                    className={`filter-tab ${filtro === valor ? "filter-tab--active" : ""}`}
                    onClick={() => setFiltro(valor)}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="citas-cal__body">
              <div>
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
                    const seleccionado = fecha === diaSeleccionado;

                    return (
                      <button
                        key={fecha}
                        className={`cal-day${esHoy ? " cal-day--today" : ""}${seleccionado ? " cal-day--selected" : ""}`}
                        onClick={() => setDiaSeleccionado(fecha)}
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
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="citas-cal__right">
                {!diaSeleccionado ? (
                  <div className="citas-cal__placeholder">
                    <CalendarDays size={40} />
                    <span>Selecciona un día para ver sus citas</span>
                  </div>
                ) : (
                  <>
                    <div className="citas-cal__detail-title">
                      {formatearFechaLarga(diaSeleccionado)}
                      {citasDelDia.length > 0 && (
                        <span>
                          {" "}· {citasDelDia.length} cita{citasDelDia.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {citasDelDia.length === 0 ? (
                      <p className="empty-state">
                        Sin citas para este día en la categoría seleccionada
                      </p>
                    ) : (
                      citasDelDia.map((cita) => (
                        <div key={cita.id} className="medico-cita-row">
                          <div>
                            <div className="medico-cita-row__patient">
                              {cita.paciente_nombre || cita.paciente_email}
                            </div>
                            <div className="medico-cita-row__details">
                              {cita.especialidad} · {cita.hora}
                            </div>
                          </div>
                          <div className="medico-cita-row__actions">
                            <Badge estado={cita.estado} />
                            {cita.estado === "pendiente" && (
                              <div className="medico-cita-row__action-row">
                                <button
                                  className="btn-confirm btn-sm"
                                  onClick={() => cambiarEstado(cita, "confirmada")}
                                >
                                  Confirmar
                                </button>
                                <button
                                  className="btn-reject btn-sm"
                                  onClick={() => cambiarEstado(cita, "rechazada")}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {cita.estado === "confirmada" && (
                              <div className="medico-cita-row__action-row">
                                <button
                                  className="btn-confirm btn-sm"
                                  onClick={() => cambiarEstado(cita, "atendida")}
                                >
                                  Marcar atendida
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DashboardMedico;
