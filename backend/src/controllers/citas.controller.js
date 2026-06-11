/**
 * @file citas.controller.js
 * @description Controladores de creación, consulta y gestión de citas médicas.
 * @module controllers/citas
 */

const citasRepo = require("../repositories/citas.repo");
const usuariosRepo = require("../repositories/usuarios.repo");
const { normalizarEmail, esViolacionUnicidad } = require("../utils");

/** Estados válidos de una cita. */
const ESTADOS = ["pendiente", "confirmada", "rechazada", "atendida"];

/**
 * Crea una nueva cita médica referenciando al paciente y al médico por id.
 * El índice único (medico, fecha, hora) de la base de datos garantiza que
 * no haya doble agendamiento, incluso con peticiones concurrentes.
 *
 * @param {express.Request} req - `req.body` con { medico_id, especialidad, fecha, hora }.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function crear(req, res, next) {
  try {
    const { medico_id, especialidad, fecha, hora } = req.body;

    if (!medico_id || !especialidad || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: "Médico, especialidad, fecha y hora son requeridos",
      });
    }

    const medico = await usuariosRepo.buscarPorId(Number(medico_id));
    if (!medico || medico.rol !== "medico") {
      return res
        .status(400)
        .json({ success: false, message: "El médico seleccionado no existe" });
    }

    // Los pacientes solo pueden agendar a su propio nombre: el id sale del
    // token. El personal (admin/medico) puede indicar el paciente por correo.
    const esStaff = ["admin", "medico"].includes(req.user.rol);
    let paciente_id = req.user.sub;

    if (esStaff && req.body.paciente_email) {
      const paciente = await usuariosRepo.buscarPorEmail(
        normalizarEmail(req.body.paciente_email)
      );
      if (!paciente) {
        return res
          .status(400)
          .json({ success: false, message: "El paciente indicado no existe" });
      }
      paciente_id = paciente.id;
    }

    const cita = await citasRepo.crear({
      paciente_id,
      medico_id: Number(medico_id),
      especialidad,
      fecha,
      hora,
    });

    res.status(201).json({ success: true, id: cita.id });
  } catch (error) {
    if (esViolacionUnicidad(error)) {
      return res.status(409).json({
        success: false,
        message: "El médico ya tiene una cita en ese horario",
      });
    }
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
async function listarPorEmail(req, res, next) {
  try {
    const citas = await citasRepo.listarPorPacienteEmail(
      normalizarEmail(req.params.email)
    );

    res.json({ success: true, citas });
  } catch (error) {
    next(error);
  }
}

/**
 * Lista las citas del sistema con el nombre del paciente y del médico
 * (para los paneles de médico y administrador). Solo personal:
 * la ruta aplica `requireRole("admin", "medico")`. Un médico solo ve las
 * citas de su propia agenda; el admin ve todas (RF-12).
 *
 * @param {express.Request} req
 * @param {express.Response} res - Respuesta JSON `{ success, citas }`.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function listarTodas(req, res, next) {
  try {
    const medicoId = req.user.rol === "medico" ? req.user.sub : undefined;
    const citas = await citasRepo.listarTodas(medicoId);
    res.json({ success: true, citas });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualiza el estado de una cita (confirmar, rechazar, atender).
 * Solo personal: la ruta aplica `requireRole("admin", "medico")`.
 *
 * @param {express.Request} req - `req.params.id` y `req.body.estado`.
 * @param {express.Response} res - Respuesta JSON con la cita actualizada.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function actualizarEstado(req, res, next) {
  try {
    const { estado } = req.body;

    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${ESTADOS.join(", ")}`,
      });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Id de cita inválido" });
    }

    const cita = await citasRepo.actualizarEstado(id, estado);

    if (!cita) {
      return res
        .status(404)
        .json({ success: false, message: "Cita no encontrada" });
    }

    res.json({ success: true, cita });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, listarPorEmail, listarTodas, actualizarEstado };
