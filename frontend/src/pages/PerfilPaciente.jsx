import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Home, KeyRound, LogOut, Pencil, User } from "lucide-react";
import {
  actualizarSesionUsuario,
  actualizarUsuario,
  cerrarSesion,
  obtenerSesion,
  obtenerUsuario,
} from "../services/api";
import "../styles/dashboard.css";

const TIPOS_SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const TIPOS_ID = [
  ["CC", "Cédula de ciudadanía"],
  ["TI", "Tarjeta de identidad"],
  ["CE", "Cédula de extranjería"],
  ["PA", "Pasaporte"],
];

function PerfilPaciente() {
  const navigate = useNavigate();

  const [datos, setDatos] = useState(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const sesion = obtenerSesion();
    if (!sesion) return;

    setDatos(sesion);

    // Refresca el perfil desde el backend por si cambió en otra sesión.
    obtenerUsuario(sesion.email)
      .then((data) => {
        if (data.success) setDatos(data.user);
      })
      .catch((err) => console.error(err));
  }, []);

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const guardarDatos = async () => {
    if (!datos.nombre) {
      alert("El nombre no puede estar vacío");
      return;
    }

    try {
      const data = await actualizarUsuario(datos.email, {
        nombre: datos.nombre,
        telefono: datos.telefono,
        tipo_id: datos.tipo_id,
        numero_id: datos.numero_id,
        rh: datos.rh,
      });

      if (data.success) {
        setDatos(data.user);
        actualizarSesionUsuario(data.user);
        setEditando(false);
      } else {
        alert(data.message || "No se pudo guardar el perfil");
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  const cancelar = () => {
    // Recarga el perfil guardado para descartar los cambios sin aplicar.
    const sesion = obtenerSesion();
    if (sesion) setDatos(sesion);
    setEditando(false);
  };

  if (!datos) return null;

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
          <button
            className="panel-sidebar__link"
            onClick={() => navigate("/dashboard-paciente")}
          >
            <Home size={16} />
            <span>Inicio</span>
          </button>
          <button className="panel-sidebar__link panel-sidebar__link--active">
            <User size={16} />
            <span>Perfil</span>
          </button>
        </nav>
      </aside>

      <main className="panel-main">
        <header className="panel-header">
          <div className="panel-header__top">
            <div className="panel-header__info">
              <h2>Mi perfil</h2>
              <p>Consulta y actualiza tus datos personales</p>
            </div>
            <button className="panel-header__logout" onClick={salir}>
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        <section className="perfil-card">
          <div className="perfil-card__head">
            <h3>Datos personales</h3>
            {!editando && (
              <button className="btn-outline btn-sm" onClick={() => setEditando(true)}>
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>

          <div className="perfil-grid">
            <div className="perfil-field perfil-field--full">
              <label>Nombre completo</label>
              <input
                name="nombre"
                value={datos.nombre ?? ""}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="perfil-field perfil-field--full">
              <label>Correo electrónico</label>
              <input
                value={datos.email ?? ""}
                disabled
                title="El correo identifica tu cuenta y no se puede cambiar"
              />
            </div>

            <div className="perfil-field">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={datos.telefono ?? ""}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>

            <div className="perfil-field">
              <label>Tipo de sangre (RH)</label>
              <select
                name="rh"
                value={datos.rh ?? ""}
                onChange={handleChange}
                disabled={!editando}
              >
                <option value="">Sin especificar</option>
                {TIPOS_SANGRE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="perfil-field">
              <label>Tipo de identificación</label>
              <select
                name="tipo_id"
                value={datos.tipo_id ?? ""}
                onChange={handleChange}
                disabled={!editando}
              >
                <option value="">Sin especificar</option>
                {TIPOS_ID.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="perfil-field">
              <label>Número de identificación</label>
              <input
                name="numero_id"
                value={datos.numero_id ?? ""}
                onChange={handleChange}
                disabled={!editando}
              />
            </div>
          </div>

          {editando && (
            <div className="perfil-actions">
              <button className="btn-confirm" onClick={guardarDatos}>
                Guardar cambios
              </button>
              <button className="btn-reject" onClick={cancelar}>
                Cancelar
              </button>
            </div>
          )}

          <div className="perfil-card__foot">
            <button
              className="btn-outline btn-sm"
              onClick={() => navigate("/cambiar-password")}
            >
              <KeyRound size={12} /> Cambiar contraseña
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PerfilPaciente;
