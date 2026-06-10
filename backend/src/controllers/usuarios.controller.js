/**
 * @file usuarios.controller.js
 * @description Controladores de consulta de usuarios.
 * @module controllers/usuarios
 */

const db = require("../db");

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
 * Obtiene los datos de un usuario a partir de su correo electrónico.
 *
 * @param {express.Request} req - `req.params.email` es el correo a buscar.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
function getPorEmail(req, res, next) {
  try {
    const user = db
      .prepare(`SELECT * FROM usuarios WHERE email = ?`)
      .get(req.params.email);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, user: sinPassword(user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPorEmail, sinPassword };
