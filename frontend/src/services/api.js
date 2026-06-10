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

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers, ...options });
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
