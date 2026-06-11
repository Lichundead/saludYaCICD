import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  actualizarMedico,
  cerrarSesion,
  eliminarMedico,
  obtenerMedicos,
} from "../services/api";
import "../styles/dashboard.css";

function DashboardAdmin() {
  const navigate = useNavigate();

  const [medicos, setMedicos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({});

  useEffect(() => {
    obtenerMedicos()
      .then((data) => {
        if (data.success) setMedicos(data.medicos);
      })
      .catch((err) => console.error(err));
  }, []);

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  const abrirEdicion = (medico) => {
    setEditandoId(medico.id);
    setFormEdicion({
      nombre: medico.nombre ?? "",
      especialidad: medico.especialidad ?? "",
      telefono: medico.telefono ?? "",
      licencia: medico.licencia ?? "",
    });
  };

  const guardarEdicion = async (id) => {
    try {
      const data = await actualizarMedico(id, formEdicion);

      if (data.success) {
        setMedicos((actuales) =>
          actuales.map((m) => (m.id === id ? data.medico : m))
        );
        setEditandoId(null);
      } else {
        alert(data.message || "No se pudo actualizar el médico");
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  const borrarMedico = async (medico) => {
    if (!confirm(`¿Eliminar la cuenta de ${medico.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const data = await eliminarMedico(medico.id);

      if (data.success) {
        setMedicos((actuales) => actuales.filter((m) => m.id !== medico.id));
      } else {
        alert(data.message || "No se pudo eliminar el médico");
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
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
            <ShieldCheck size={18} />
          </div>
          <div className="panel-sidebar__title">
            <h1>SaludYa</h1>
            <span>Administrador</span>
          </div>
        </div>

        <nav className="panel-sidebar__nav">
          <button className="panel-sidebar__link panel-sidebar__link--active">
            <Users size={16} />
            <span>Médicos</span>
          </button>
          <button
            className="panel-sidebar__link"
            onClick={() => navigate("/crear-medico")}
          >
            <UserPlus size={16} />
            <span>Crear cuenta médico</span>
          </button>
        </nav>
      </aside>

      <main className="panel-main">
        <header className="panel-header">
          <div className="panel-header__top">
            <div className="panel-header__info">
              <h2>Panel de control</h2>
              <p>{fechaHeader.charAt(0).toUpperCase() + fechaHeader.slice(1)}</p>
            </div>
            <button className="panel-header__logout" onClick={salir}>
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <section className="panel-tabla-box">
          <h3>Médicos registrados ({medicos.length})</h3>

          <table className="panel-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Licencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {medicos.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="empty-state">No hay médicos registrados aún.</p>
                  </td>
                </tr>
              ) : (
                medicos.map((medico) =>
                  editandoId === medico.id ? (
                    <tr key={medico.id}>
                      <td>
                        <input
                          className="panel-input"
                          value={formEdicion.nombre}
                          onChange={(e) =>
                            setFormEdicion({ ...formEdicion, nombre: e.target.value })
                          }
                        />
                      </td>
                      <td>{medico.email}</td>
                      <td>
                        <input
                          className="panel-input"
                          value={formEdicion.especialidad}
                          onChange={(e) =>
                            setFormEdicion({ ...formEdicion, especialidad: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="panel-input"
                          value={formEdicion.telefono}
                          onChange={(e) =>
                            setFormEdicion({ ...formEdicion, telefono: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="panel-input"
                          value={formEdicion.licencia}
                          onChange={(e) =>
                            setFormEdicion({ ...formEdicion, licencia: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <div className="panel-tabla__acciones">
                          <button
                            className="btn-confirm btn-sm"
                            onClick={() => guardarEdicion(medico.id)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn-reject btn-sm"
                            onClick={() => setEditandoId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={medico.id}>
                      <td>{medico.nombre}</td>
                      <td>{medico.email}</td>
                      <td>{medico.especialidad || "—"}</td>
                      <td>{medico.telefono || "—"}</td>
                      <td>{medico.licencia || "—"}</td>
                      <td>
                        <div className="panel-tabla__acciones">
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => abrirEdicion(medico)}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button
                            className="btn-reject btn-sm"
                            onClick={() => borrarMedico(medico)}
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default DashboardAdmin;
