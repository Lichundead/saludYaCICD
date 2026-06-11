/**
 * @file citas.routes.js
 * @description Rutas de citas médicas con su documentación OpenAPI.
 * @module routes/citas
 */

const { Router } = require("express");
const {
  crear,
  listarPorEmail,
  listarTodas,
  actualizarEstado,
} = require("../controllers/citas.controller");
const {
  requireAuth,
  requireSelfOrStaff,
  requireRole,
} = require("../middleware/auth");

const router = Router();

/**
 * @openapi
 * /citas:
 *   get:
 *     summary: Lista las citas del sistema
 *     description: Requiere rol admin o medico. Un médico solo recibe las citas de su propia agenda; el admin las ve todas. Incluye el nombre del paciente.
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de citas.
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       403:
 *         description: Solo accesible para personal (admin o medico).
 */
router.get("/citas", requireAuth, requireRole("admin", "medico"), listarTodas);

/**
 * @openapi
 * /citas/{id}/estado:
 *   patch:
 *     summary: Actualiza el estado de una cita
 *     description: Requiere rol admin o medico. Estados permitidos - pendiente, confirmada, rechazada, atendida.
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, confirmada, rechazada, atendida]
 *                 example: confirmada
 *     responses:
 *       200:
 *         description: Cita actualizada; devuelve la cita resultante.
 *       400:
 *         description: Estado inválido.
 *       403:
 *         description: Solo accesible para personal (admin o medico).
 *       404:
 *         description: Cita no encontrada.
 */
router.patch(
  "/citas/:id/estado",
  requireAuth,
  requireRole("admin", "medico"),
  actualizarEstado
);

/**
 * @openapi
 * /citas:
 *   post:
 *     summary: Crea una nueva cita médica
 *     description: Requiere autenticación. Los pacientes solo pueden agendar a su propio nombre (el id se toma del token). El horario del médico no puede duplicarse.
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medico_id, especialidad, fecha, hora]
 *             properties:
 *               paciente_email:
 *                 type: string
 *                 format: email
 *                 description: Solo lo puede indicar el personal (admin/medico).
 *                 example: demo@saludya.com
 *               medico_id:
 *                 type: integer
 *                 description: Id de un usuario con rol medico (ver GET /medicos).
 *                 example: 3
 *               especialidad:
 *                 type: string
 *                 example: Medicina general
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-15"
 *               hora:
 *                 type: string
 *                 example: "09:30"
 *     responses:
 *       201:
 *         description: Cita creada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: integer
 *                   example: 7
 *       400:
 *         description: Faltan campos requeridos o el médico no existe.
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       409:
 *         description: El médico ya tiene una cita en ese horario.
 */
router.post("/citas", requireAuth, crear);

/**
 * @openapi
 * /citas/{email}:
 *   get:
 *     summary: Lista las citas de un paciente
 *     description: Requiere autenticación. Un paciente solo puede consultar sus propias citas; admin y medico pueden consultar las de cualquiera.
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo del paciente cuyas citas se desean consultar.
 *         example: demo@saludya.com
 *     responses:
 *       200:
 *         description: Lista de citas del paciente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 citas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cita'
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       403:
 *         description: Sin permiso para consultar las citas de otro paciente.
 */
router.get("/citas/:email", requireAuth, requireSelfOrStaff, listarPorEmail);

module.exports = router;
