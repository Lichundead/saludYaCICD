/**
 * @file usuarios.repo.js
 * @description Acceso a datos de la tabla `usuarios`. Único lugar del código
 * con consultas sobre usuarios; los controladores no tocan la base directamente.
 * @module repositories/usuarios
 */

const { eq } = require("drizzle-orm");
const { getDb } = require("../db/client");
const { usuarios } = require("../db/schema");

/**
 * Busca un usuario por correo (ya normalizado a minúsculas).
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
async function buscarPorEmail(email) {
  const [usuario] = await getDb()
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email));
  return usuario;
}

/**
 * Busca un usuario por id.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
async function buscarPorId(id) {
  const [usuario] = await getDb()
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, id));
  return usuario;
}

/**
 * Crea un usuario y devuelve la fila insertada.
 * @param {object} datos - Columnas de la tabla `usuarios`.
 * @returns {Promise<object>}
 */
async function crear(datos) {
  const [usuario] = await getDb().insert(usuarios).values(datos).returning();
  return usuario;
}

/**
 * Actualiza campos de perfil de un usuario identificado por correo.
 * @param {string} email
 * @param {object} cambios - Columnas a actualizar.
 * @returns {Promise<object|undefined>} La fila actualizada.
 */
async function actualizarPerfil(email, cambios) {
  const [usuario] = await getDb()
    .update(usuarios)
    .set(cambios)
    .where(eq(usuarios.email, email))
    .returning();
  return usuario;
}

/**
 * Reemplaza el hash de contraseña de un usuario y limpia la marca de
 * contraseña temporal.
 * @param {number} id
 * @param {string} password - Hash scrypt.
 */
async function actualizarPassword(id, password) {
  await getDb()
    .update(usuarios)
    .set({ password, debe_cambiar_password: false })
    .where(eq(usuarios.id, id));
}

/**
 * Actualiza campos de un usuario identificado por id (CRUD de médicos).
 * @param {number} id
 * @param {object} cambios - Columnas a actualizar.
 * @returns {Promise<object|undefined>} La fila actualizada.
 */
async function actualizarPorId(id, cambios) {
  const [usuario] = await getDb()
    .update(usuarios)
    .set(cambios)
    .where(eq(usuarios.id, id))
    .returning();
  return usuario;
}

/**
 * Elimina un usuario por id. Lanza violación de FK si tiene citas asociadas.
 * @param {number} id
 * @returns {Promise<boolean>} true si existía.
 */
async function eliminarPorId(id) {
  const filas = await getDb()
    .delete(usuarios)
    .where(eq(usuarios.id, id))
    .returning();
  return filas.length > 0;
}

/**
 * Lista las cuentas con rol `medico`.
 * @returns {Promise<object[]>}
 */
function listarMedicos() {
  return getDb()
    .select()
    .from(usuarios)
    .where(eq(usuarios.rol, "medico"))
    .orderBy(usuarios.nombre);
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  crear,
  actualizarPerfil,
  actualizarPassword,
  actualizarPorId,
  eliminarPorId,
  listarMedicos,
};
