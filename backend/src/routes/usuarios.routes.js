/**
 * @file usuarios.routes.js
 * @description Rutas de consulta de usuarios con su documentación OpenAPI.
 * @module routes/usuarios
 */

const { Router } = require("express");
const { getPorEmail } = require("../controllers/usuarios.controller");
const { requireAuth, requireSelfOrStaff } = require("../middleware/auth");

const router = Router();

/**
 * @openapi
 * /usuario/{email}:
 *   get:
 *     summary: Obtiene un usuario por su correo
 *     description: Requiere autenticación. Un paciente solo puede consultar su propio perfil; admin y medico pueden consultar cualquiera.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo electrónico del usuario a consultar.
 *         example: demo@saludya.com
 *     responses:
 *       200:
 *         description: Datos del usuario encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       403:
 *         description: Sin permiso para consultar a otro usuario.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get("/usuario/:email", requireAuth, requireSelfOrStaff, getPorEmail);

module.exports = router;
