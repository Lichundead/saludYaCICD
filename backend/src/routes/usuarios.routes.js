/**
 * @file usuarios.routes.js
 * @description Rutas de consulta de usuarios con su documentación OpenAPI.
 * @module routes/usuarios
 */

const { Router } = require("express");
const {
  getPorEmail,
  actualizar,
  listarMedicos,
  crearMedico,
} = require("../controllers/usuarios.controller");
const {
  requireAuth,
  requireSelfOrStaff,
  requireRole,
} = require("../middleware/auth");

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

/**
 * @openapi
 * /usuario/{email}:
 *   put:
 *     summary: Actualiza el perfil de un usuario
 *     description: Requiere autenticación. Un paciente solo puede actualizar su propio perfil. El correo, el rol y la contraseña no se modifican por esta vía.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Paciente Demo
 *               telefono:
 *                 type: string
 *                 example: "3000000000"
 *               tipo_id:
 *                 type: string
 *                 example: CC
 *               numero_id:
 *                 type: string
 *                 example: "12345678"
 *               rh:
 *                 type: string
 *                 example: "O+"
 *     responses:
 *       200:
 *         description: Perfil actualizado; devuelve el usuario resultante.
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       403:
 *         description: Sin permiso para actualizar a otro usuario.
 *       404:
 *         description: Usuario no encontrado.
 */
router.put("/usuario/:email", requireAuth, requireSelfOrStaff, actualizar);

/**
 * @openapi
 * /medicos:
 *   get:
 *     summary: Lista las cuentas de médicos
 *     description: Requiere autenticación. El admin recibe los datos completos; los demás roles solo id, nombre y especialidad (para agendar citas).
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos registrados.
 *       401:
 *         description: Token ausente, inválido o expirado.
 *   post:
 *     summary: Crea una cuenta de médico
 *     description: Requiere rol admin. La cuenta se crea con rol `medico` y contraseña hasheada.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Paula García
 *               email:
 *                 type: string
 *                 format: email
 *                 example: paula@saludya.com
 *               password:
 *                 type: string
 *                 example: "claveSegura123"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               tipo_id:
 *                 type: string
 *                 example: CC
 *               numero_id:
 *                 type: string
 *                 example: "1090123456"
 *               especialidad:
 *                 type: string
 *                 example: Medicina general
 *               licencia:
 *                 type: string
 *                 example: "RM-12345"
 *     responses:
 *       201:
 *         description: Médico creado correctamente.
 *       400:
 *         description: Faltan campos requeridos o el correo es inválido.
 *       403:
 *         description: Solo accesible para administradores.
 *       409:
 *         description: El correo ya está registrado.
 */
router.get("/medicos", requireAuth, listarMedicos);
router.post("/medicos", requireAuth, requireRole("admin"), crearMedico);

module.exports = router;
