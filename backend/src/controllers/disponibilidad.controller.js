/**
 * @file disponibilidad.controller.js
 * @description Gestión de los bloques de atención del médico y cálculo de
 * los slots libres de 30 minutos que ven los pacientes al agendar.
 * @module controllers/disponibilidad
 */

const disponibilidadRepo = require("../repositories/disponibilidad.repo");
const citasRepo = require("../repositories/citas.repo");
const usuariosRepo = require("../repositories/usuarios.repo");
const { HORA_REGEX, generarSlots, hoyISO, esViolacionUnicidad } = require("../utils");

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Crea un bloque de disponibilidad para el médico autenticado.
 * Valida formato, orden de horas, fecha futura y solapamiento con
 * bloques existentes del mismo día (HU-T11).
 *
 * @param {express.Request} req - `req.body` con { fecha, hora_inicio, hora_fin }.
 * @param {express.Response} res - Respuesta JSON con el bloque creado.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function crear(req, res, next) {
  try {
    const { fecha, hora_inicio, hora_fin } = req.body;
    const medico_id = req.user.sub;

    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: "Fecha, hora de inicio y hora de fin son requeridas",
      });
    }

    if (!FECHA_REGEX.test(fecha) || !HORA_REGEX.test(hora_inicio) || !HORA_REGEX.test(hora_fin)) {
      return res.status(400).json({
        success: false,
        message: "Formato inválido: fecha YYYY-MM-DD y horas HH:MM",
      });
    }

    if (hora_fin <= hora_inicio) {
      return res.status(400).json({
        success: false,
        message: "La hora de fin debe ser posterior a la de inicio",
      });
    }

    if (fecha < hoyISO()) {
      return res.status(400).json({
        success: false,
        message: "No se puede crear disponibilidad en fechas pasadas",
      });
    }

    const bloquesDelDia = await disponibilidadRepo.listarPorMedicoYFecha(
      medico_id,
      fecha
    );

    const seSolapa = bloquesDelDia.some(
      (b) => hora_inicio < b.hora_fin && hora_fin > b.hora_inicio
    );

    if (seSolapa) {
      return res.status(409).json({
        success: false,
        message: "El bloque se solapa con otro ya registrado para ese día",
      });
    }

    const bloque = await disponibilidadRepo.crear({
      medico_id,
      fecha,
      hora_inicio,
      hora_fin,
    });

    res.status(201).json({ success: true, bloque });
  } catch (error) {
    if (esViolacionUnicidad(error)) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un bloque idéntico para ese día",
      });
    }
    next(error);
  }
}

/**
 * Lista los bloques de disponibilidad del médico autenticado (desde hoy).
 *
 * @param {express.Request} req
 * @param {express.Response} res - Respuesta JSON `{ success, bloques }`.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function listarPropia(req, res, next) {
  try {
    const bloques = await disponibilidadRepo.listarPorMedico(
      req.user.sub,
      hoyISO()
    );
    res.json({ success: true, bloques });
  } catch (error) {
    next(error);
  }
}

/**
 * Elimina un bloque de disponibilidad. Solo su dueño (o un admin).
 *
 * @param {express.Request} req - `req.params.id`.
 * @param {express.Response} res - Respuesta JSON.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function eliminar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const bloque = await disponibilidadRepo.buscarPorId(id);

    if (!bloque) {
      return res
        .status(404)
        .json({ success: false, message: "Bloque no encontrado" });
    }

    if (req.user.rol !== "admin" && bloque.medico_id !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: "No puedes eliminar la disponibilidad de otro médico",
      });
    }

    await disponibilidadRepo.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Calcula los slots libres de un médico a partir de hoy:
 * slots de 30 min derivados de sus bloques, menos las horas ya ocupadas
 * por citas no rechazadas. Es lo que consume la pantalla de agendar.
 *
 * @param {express.Request} req - `req.params.id` es el id del médico.
 * @param {express.Response} res - `{ success, slots: { "YYYY-MM-DD": ["HH:MM", ...] } }`.
 * @param {express.NextFunction} next - Pasa errores al middleware de errores.
 */
async function slotsLibres(req, res, next) {
  try {
    const medicoId = Number(req.params.id);
    const medico = await usuariosRepo.buscarPorId(medicoId);

    if (!medico || medico.rol !== "medico") {
      return res
        .status(404)
        .json({ success: false, message: "Médico no encontrado" });
    }

    const slots = await calcularSlotsLibres(medicoId);
    res.json({ success: true, slots });
  } catch (error) {
    next(error);
  }
}

/**
 * Lógica compartida de slots libres (también la usa la validación al crear citas).
 *
 * @param {number} medicoId
 * @returns {Promise<Record<string, string[]>>} Mapa fecha → horas libres ordenadas.
 */
async function calcularSlotsLibres(medicoId) {
  const desde = hoyISO();
  const [bloques, ocupadas] = await Promise.all([
    disponibilidadRepo.listarPorMedico(medicoId, desde),
    citasRepo.horasOcupadas(medicoId, desde),
  ]);

  const ocupadasSet = new Set(ocupadas.map((c) => `${c.fecha}|${c.hora}`));

  const slots = {};
  for (const bloque of bloques) {
    for (const hora of generarSlots(bloque.hora_inicio, bloque.hora_fin)) {
      if (!ocupadasSet.has(`${bloque.fecha}|${hora}`)) {
        (slots[bloque.fecha] ??= []).push(hora);
      }
    }
  }

  for (const fecha of Object.keys(slots)) {
    slots[fecha].sort();
  }

  return slots;
}

module.exports = { crear, listarPropia, eliminar, slotsLibres, calcularSlotsLibres };
