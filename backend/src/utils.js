/**
 * @file utils.js
 * @description Helpers compartidos entre controladores.
 * @module utils
 */

/** Validación básica de formato de correo electrónico. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normaliza un correo para almacenamiento y búsqueda: minúsculas y sin
 * espacios alrededor. Evita que "Ana@x.com" y "ana@x.com" sean cuentas
 * distintas o que el login falle por mayúsculas.
 *
 * @param {string} email
 * @returns {string}
 */
function normalizarEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

/**
 * Devuelve una copia del usuario sin el campo `password`.
 * Evita exponer el hash (o la contraseña antigua) en las respuestas de la API.
 *
 * @param {object} user - Fila de la tabla `usuarios`.
 * @returns {object} Usuario sin el campo `password`.
 */
function sinPassword(user) {
  const { password, ...resto } = user;
  return resto;
}

/**
 * Indica si un error (o su cadena de causas) es una violación de unicidad
 * de PostgreSQL (código 23505), p. ej. correo duplicado o doble agendamiento.
 *
 * @param {Error} error
 * @returns {boolean}
 */
function esViolacionUnicidad(error) {
  for (let e = error; e; e = e.cause) {
    if (e.code === "23505" || /duplicate key|llave duplicada/i.test(e.message ?? "")) {
      return true;
    }
  }
  return false;
}

/** Validación de hora en formato HH:MM (24 horas). */
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Genera los slots de 30 minutos contenidos en un rango horario.
 * Ej.: ("08:00", "10:00") → ["08:00", "08:30", "09:00", "09:30"].
 *
 * @param {string} horaInicio - Formato HH:MM.
 * @param {string} horaFin - Formato HH:MM (exclusiva).
 * @returns {string[]}
 */
function generarSlots(horaInicio, horaFin) {
  const [hi, mi] = horaInicio.split(":").map(Number);
  const [hf, mf] = horaFin.split(":").map(Number);

  const slots = [];
  for (let t = hi * 60 + mi; t + 30 <= hf * 60 + mf; t += 30) {
    const horas = String(Math.floor(t / 60)).padStart(2, "0");
    const minutos = String(t % 60).padStart(2, "0");
    slots.push(`${horas}:${minutos}`);
  }
  return slots;
}

/** Fecha local de Colombia en formato YYYY-MM-DD. */
function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

module.exports = {
  EMAIL_REGEX,
  HORA_REGEX,
  normalizarEmail,
  sinPassword,
  esViolacionUnicidad,
  generarSlots,
  hoyISO,
};
