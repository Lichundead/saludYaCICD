/**
 * @file disponibilidad.routes.js
 * @description Rutas de disponibilidad del médico y consulta de slots libres.
 * @module routes/disponibilidad
 */

const { Router } = require("express");
const {
  crear,
  listarPropia,
  eliminar,
  slotsLibres,
} = require("../controllers/disponibilidad.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();

/** Lista los bloques de disponibilidad del médico autenticado (desde hoy). */
router.get("/disponibilidad", requireAuth, requireRole("medico"), listarPropia);

/** Crea un bloque de disponibilidad (valida solapamientos del mismo día). */
router.post("/disponibilidad", requireAuth, requireRole("medico"), crear);

/** Elimina un bloque de disponibilidad (su dueño o un admin). */
router.delete(
  "/disponibilidad/:id",
  requireAuth,
  requireRole("medico", "admin"),
  eliminar
);

/** Slots libres de un médico (disponibilidad menos citas tomadas) para agendar. */
router.get("/medicos/:id/slots", requireAuth, slotsLibres);

module.exports = router;
