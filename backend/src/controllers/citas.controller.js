/**
 * @file citas.controller.js
 * @description Controladores de creación y consulta de citas médicas.
 * @module controllers/citas
 */

const db = require("../db");

/**
 * Crea una nueva cita médica en la tabla `citas`.
 *
 * @param {express.Request} req - `req.body` contiene los datos de la cita.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
function crear(req, res, next) {
  try {
    const { especialidad, medico, fecha, hora } = req.body;

    // Los pacientes solo pueden agendar citas a su propio nombre: el correo
    // sale del token, no del cuerpo. El personal (admin/medico) sí puede
    // indicar el paciente.
    const esStaff = ["admin", "medico"].includes(req.user.rol);
    const paciente_email = esStaff
      ? req.body.paciente_email || req.user.email
      : req.user.email;

    if (!paciente_email || !especialidad || !medico || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos de la cita son requeridos",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO citas
         (paciente_email, especialidad, medico, fecha, hora)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(paciente_email, especialidad, medico, fecha, hora);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene todas las citas asociadas al correo de un paciente.
 *
 * @param {express.Request} req - `req.params.email` es el correo del paciente.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
function listarPorEmail(req, res, next) {
  try {
    const citas = db
      .prepare(`SELECT * FROM citas WHERE paciente_email = ?`)
      .all(req.params.email);

    res.json({ success: true, citas });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, listarPorEmail };
