/**
 * @file citas.routes.js
 * @description Rutas de citas médicas: creación, consulta, cambio de estado
 * y reprogramación.
 * @module routes/citas
 */

const { Router } = require("express");
const {
  crear,
  listarPorEmail,
  listarTodas,
  actualizarEstado,
  reprogramarCita,
} = require("../controllers/citas.controller");
const {
  requireAuth,
  requireSelfOrStaff,
  requireRole,
} = require("../middleware/auth");

const router = Router();

/** Lista las citas del sistema. Un médico ve solo su agenda; el admin, todas. */
router.get("/citas", requireAuth, requireRole("admin", "medico"), listarTodas);

/** Cambia el estado de una cita (pendiente/confirmada/rechazada/atendida). */
router.patch(
  "/citas/:id/estado",
  requireAuth,
  requireRole("admin", "medico"),
  actualizarEstado
);

/** Reprograma la fecha y hora de una cita (personal; médico solo su agenda). */
router.patch(
  "/citas/:id/reprogramar",
  requireAuth,
  requireRole("admin", "medico"),
  reprogramarCita
);

/** Crea una cita. El paciente solo agenda a su nombre y dentro de la disponibilidad. */
router.post("/citas", requireAuth, crear);

/** Lista las citas de un paciente (propias, o cualquiera si es personal). */
router.get("/citas/:email", requireAuth, requireSelfOrStaff, listarPorEmail);

module.exports = router;
