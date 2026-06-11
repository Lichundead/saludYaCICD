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

module.exports = { EMAIL_REGEX, normalizarEmail, sinPassword, esViolacionUnicidad };
