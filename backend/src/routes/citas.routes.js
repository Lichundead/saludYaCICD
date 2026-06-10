/**
 * @file citas.routes.js
 * @description Rutas de citas médicas con su documentación OpenAPI.
 * @module routes/citas
 */

const { Router } = require("express");
const { crear, listarPorEmail } = require("../controllers/citas.controller");
const { requireAuth, requireSelfOrStaff } = require("../middleware/auth");

const router = Router();

/**
 * @openapi
 * /citas:
 *   post:
 *     summary: Crea una nueva cita médica
 *     description: Requiere autenticación. Los pacientes solo pueden agendar a su propio nombre (el correo se toma del token).
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [especialidad, medico, fecha, hora]
 *             properties:
 *               paciente_email:
 *                 type: string
 *                 format: email
 *                 description: Solo lo puede indicar el personal (admin/medico).
 *                 example: demo@saludya.com
 *               especialidad:
 *                 type: string
 *                 example: Medicina general
 *               medico:
 *                 type: string
 *                 example: Paula García
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
 *         description: Faltan campos requeridos.
 *       401:
 *         description: Token ausente, inválido o expirado.
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
