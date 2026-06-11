/**
 * @file disponibilidad.repo.js
 * @description Acceso a datos de la tabla `disponibilidad` (bloques de
 * atención definidos por cada médico).
 * @module repositories/disponibilidad
 */

const { and, eq, gte } = require("drizzle-orm");
const { getDb } = require("../db/client");
const { disponibilidad } = require("../db/schema");

/**
 * Crea un bloque de disponibilidad.
 * @param {object} datos - { medico_id, fecha, hora_inicio, hora_fin }
 * @returns {Promise<object>}
 */
async function crear(datos) {
  const [bloque] = await getDb().insert(disponibilidad).values(datos).returning();
  return bloque;
}

/**
 * Lista los bloques de un médico, opcionalmente desde una fecha.
 * @param {number} medicoId
 * @param {string} [desdeFecha] - YYYY-MM-DD inclusive.
 * @returns {Promise<object[]>}
 */
function listarPorMedico(medicoId, desdeFecha) {
  const condiciones = [eq(disponibilidad.medico_id, medicoId)];
  if (desdeFecha) condiciones.push(gte(disponibilidad.fecha, desdeFecha));

  return getDb()
    .select()
    .from(disponibilidad)
    .where(and(...condiciones))
    .orderBy(disponibilidad.fecha, disponibilidad.hora_inicio);
}

/**
 * Lista los bloques de un médico en una fecha concreta.
 * @param {number} medicoId
 * @param {string} fecha - YYYY-MM-DD.
 * @returns {Promise<object[]>}
 */
function listarPorMedicoYFecha(medicoId, fecha) {
  return getDb()
    .select()
    .from(disponibilidad)
    .where(
      and(eq(disponibilidad.medico_id, medicoId), eq(disponibilidad.fecha, fecha))
    );
}

/**
 * Busca un bloque por id.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
async function buscarPorId(id) {
  const [bloque] = await getDb()
    .select()
    .from(disponibilidad)
    .where(eq(disponibilidad.id, id));
  return bloque;
}

/**
 * Elimina un bloque por id.
 * @param {number} id
 * @returns {Promise<boolean>} true si existía.
 */
async function eliminar(id) {
  const filas = await getDb()
    .delete(disponibilidad)
    .where(eq(disponibilidad.id, id))
    .returning();
  return filas.length > 0;
}

/**
 * Elimina todos los bloques de un médico (al eliminar su cuenta).
 * @param {number} medicoId
 */
async function eliminarPorMedico(medicoId) {
  await getDb()
    .delete(disponibilidad)
    .where(eq(disponibilidad.medico_id, medicoId));
}

module.exports = {
  crear,
  listarPorMedico,
  listarPorMedicoYFecha,
  buscarPorId,
  eliminar,
  eliminarPorMedico,
};
