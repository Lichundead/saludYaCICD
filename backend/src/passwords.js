/**
 * @file passwords.js
 * @description Hash y verificación de contraseñas con `node:crypto` (scrypt).
 * Las contraseñas se almacenan como `scrypt:<salt>:<hash>`. Se mantiene
 * compatibilidad con registros antiguos guardados en texto plano: la
 * verificación los acepta y el controlador de login los re-hashea.
 * @module passwords
 */

const { scryptSync, randomBytes, timingSafeEqual } = require("node:crypto");

const KEY_LENGTH = 64;
const PREFIX = "scrypt";

/**
 * Genera el hash de una contraseña en texto plano.
 *
 * @param {string} password - Contraseña en texto plano.
 * @returns {string} Cadena `scrypt:<salt>:<hash>` lista para almacenar.
 */
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${PREFIX}:${salt}:${hash}`;
}

/**
 * Indica si un valor almacenado ya tiene formato de hash scrypt.
 *
 * @param {string} stored - Valor almacenado en la columna `password`.
 * @returns {boolean}
 */
function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith(`${PREFIX}:`);
}

/**
 * Verifica una contraseña contra el valor almacenado.
 * Acepta tanto hashes scrypt como contraseñas antiguas en texto plano.
 *
 * @param {string} password - Contraseña en texto plano a verificar.
 * @param {string} stored - Valor almacenado (hash o texto plano antiguo).
 * @returns {boolean} `true` si la contraseña es válida.
 */
function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") {
    return false;
  }

  if (!isHashed(stored)) {
    return password === stored;
  }

  const [, salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, KEY_LENGTH);

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

module.exports = { hashPassword, verifyPassword, isHashed };
