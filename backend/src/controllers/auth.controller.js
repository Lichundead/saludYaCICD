/**
 * @file auth.controller.js
 * @description Controladores de autenticación: inicio de sesión y registro.
 * @module controllers/auth
 */

const db = require("../db");
const { hashPassword, verifyPassword, isHashed } = require("../passwords");
const { sinPassword } = require("./usuarios.controller");
const { firmarToken } = require("../middleware/auth");

/** Validación básica de formato de correo electrónico. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Autentica a un usuario validando su correo y contraseña.
 * Si el registro aún guarda la contraseña en texto plano (datos antiguos),
 * se re-hashea automáticamente tras un login exitoso.
 *
 * @param {express.Request} req - `req.body` debe contener `email` y `password`.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Correo y contraseña son requeridos" });
    }

    const user = db
      .prepare(`SELECT * FROM usuarios WHERE email = ?`)
      .get(email);

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false });
    }

    if (!isHashed(user.password)) {
      db.prepare(`UPDATE usuarios SET password = ? WHERE id = ?`).run(
        hashPassword(password),
        user.id
      );
    }

    res.json({ success: true, user: sinPassword(user), token: firmarToken(user) });
  } catch (error) {
    next(error);
  }
}

/**
 * Registra un nuevo usuario (paciente) en la tabla `usuarios`.
 * La contraseña se almacena hasheada con scrypt.
 *
 * @param {express.Request} req - `req.body` contiene los datos del usuario.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
function register(req, res, next) {
  try {
    const { nombre, email, password, telefono, tipo_id, numero_id, rh } =
      req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, correo y contraseña son requeridos",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "El correo no tiene un formato válido" });
    }

    const existente = db
      .prepare(`SELECT id FROM usuarios WHERE email = ?`)
      .get(email);

    if (existente) {
      return res
        .status(409)
        .json({ success: false, message: "El correo ya está registrado" });
    }

    // El rol siempre es "paciente": nunca se acepta del cliente para evitar
    // que un registro público se autoasigne privilegios.
    const result = db
      .prepare(
        `INSERT INTO usuarios
         (nombre, email, password, telefono, tipo_id, numero_id, rh, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'paciente')`
      )
      .run(nombre, email, hashPassword(password), telefono, tipo_id, numero_id, rh);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register };
