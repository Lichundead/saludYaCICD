/**
 * Cliente HTTP centralizado de la API de SaludYa.
 * La URL base se configura con la variable de entorno `VITE_API_URL`
 * y por defecto apunta al backend local de desarrollo.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const TOKEN_KEY = "token";
const USUARIO_KEY = "usuario";

/** Guarda el token y el usuario devueltos por el login. */
export function guardarSesion({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(user));
}

/** Devuelve el usuario de la sesión actual, o null si no hay sesión. */
export function obtenerSesion() {
  if (!localStorage.getItem(TOKEN_KEY)) return null;
  try {
    return JSON.parse(localStorage.getItem(USUARIO_KEY));
  } catch {
    return null;
  }
}

/** Indica si hay una sesión iniciada. */
export function haySesion() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

/** Cierra la sesión eliminando el token y el usuario almacenados. */
export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

/** Actualiza el usuario guardado en la sesión (tras editar el perfil). */
export function actualizarSesionUsuario(user) {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(user));
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers, ...options });

  // Token expirado o inválido con sesión activa: cerrar sesión y volver al login.
  if (res.status === 401 && token) {
    cerrarSesion();
    window.location.assign("/");
    return { success: false, message: "Tu sesión expiró, inicia sesión de nuevo" };
  }

  return res.json();
}

/** Inicia sesión. Devuelve `{ success, user }`. */
export function login(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Registra un nuevo paciente. Devuelve `{ success, id }`. */
export function registrarPaciente(datos) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Crea una cita médica. Devuelve `{ success, id }`. */
export function crearCita(cita) {
  return request("/citas", {
    method: "POST",
    body: JSON.stringify(cita),
  });
}

/** Lista las citas de un paciente. Devuelve `{ success, citas }`. */
export function obtenerCitas(email) {
  return request(`/citas/${encodeURIComponent(email)}`);
}

/** Obtiene un usuario por correo. Devuelve `{ success, user }`. */
export function obtenerUsuario(email) {
  return request(`/usuario/${encodeURIComponent(email)}`);
}

/** Actualiza el perfil de un usuario. Devuelve `{ success, user }`. */
export function actualizarUsuario(email, datos) {
  return request(`/usuario/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

/** Crea una cuenta de médico (solo admin). Devuelve `{ success, id }`. */
export function crearMedico(datos) {
  return request("/medicos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Lista las cuentas de médicos (solo admin). Devuelve `{ success, medicos }`. */
export function obtenerMedicos() {
  return request("/medicos");
}

/** Lista todas las citas del sistema (admin/medico). Devuelve `{ success, citas }`. */
export function obtenerTodasLasCitas() {
  return request("/citas");
}

/** Cambia el estado de una cita (admin/medico). Devuelve `{ success, cita }`. */
export function actualizarEstadoCita(id, estado) {
  return request(`/citas/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

/** Reprograma una cita (admin/medico). Devuelve `{ success, cita }`. */
export function reprogramarCita(id, fecha, hora) {
  return request(`/citas/${id}/reprogramar`, {
    method: "PATCH",
    body: JSON.stringify({ fecha, hora }),
  });
}

/** Restablece la contraseña verificando el documento. Devuelve `{ success }`. */
export function recuperarPassword(datos) {
  return request("/recover", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Cambia la contraseña del usuario autenticado. Devuelve `{ success }`. */
export function cambiarPassword(passwordActual, passwordNueva) {
  return request("/cambiar-password", {
    method: "POST",
    body: JSON.stringify({
      password_actual: passwordActual,
      password_nueva: passwordNueva,
    }),
  });
}

/** Slots libres de un médico: `{ success, slots: { fecha: [horas] } }`. */
export function obtenerSlots(medicoId) {
  return request(`/medicos/${medicoId}/slots`);
}

/** Bloques de disponibilidad del médico autenticado. */
export function obtenerDisponibilidad() {
  return request("/disponibilidad");
}

/** Crea un bloque de disponibilidad (medico). Devuelve `{ success, bloque }`. */
export function crearDisponibilidad(datos) {
  return request("/disponibilidad", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Elimina un bloque de disponibilidad propio. */
export function eliminarDisponibilidad(id) {
  return request(`/disponibilidad/${id}`, { method: "DELETE" });
}

/** Actualiza los datos de un médico (admin). Devuelve `{ success, medico }`. */
export function actualizarMedico(id, datos) {
  return request(`/medicos/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

/** Elimina una cuenta de médico (admin). */
export function eliminarMedico(id) {
  return request(`/medicos/${id}`, { method: "DELETE" });
}
