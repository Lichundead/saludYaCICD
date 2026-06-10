/**
 * @file auth.js
 * @description Middleware de autenticación (JWT Bearer) y helpers de autorización.
 * @module middleware/auth
 */

const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Exige un token JWT válido en la cabecera `Authorization: Bearer <token>`.
 * Si es válido, deja el payload (`{ sub, email, rol }`) en `req.user`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token de autenticación requerido" });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Token inválido o expirado" });
  }
}

/**
 * Exige que el `:email` de la ruta sea el del usuario autenticado,
 * salvo que este tenga rol `admin` o `medico`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function requireSelfOrStaff(req, res, next) {
  const esStaff = ["admin", "medico"].includes(req.user.rol);

  if (!esStaff && req.user.email !== req.params.email) {
    return res
      .status(403)
      .json({ success: false, message: "No tienes permiso para acceder a este recurso" });
  }

  next();
}

/**
 * Genera el token de sesión de un usuario.
 *
 * @param {object} user - Fila de la tabla `usuarios`.
 * @returns {string} JWT firmado con `{ sub, email, rol }`.
 */
function firmarToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, rol: user.rol },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

module.exports = { requireAuth, requireSelfOrStaff, firmarToken };
