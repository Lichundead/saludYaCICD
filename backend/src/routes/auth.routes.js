/**
 * @file auth.routes.js
 * @description Rutas de autenticación (login y registro) con su documentación OpenAPI.
 * @module routes/auth
 */

const { Router } = require("express");
const { login, register } = require("../controllers/auth.controller");

const router = Router();

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     description: Verifica las credenciales (correo y contraseña) contra la tabla de usuarios.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: demo@saludya.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Autenticación exitosa.
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
 *                 token:
 *                   type: string
 *                   description: JWT de sesión para las rutas protegidas.
 *       400:
 *         description: Faltan el correo o la contraseña.
 *       401:
 *         description: Credenciales inválidas.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/login", login);

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     description: Crea un usuario (paciente) en la base de datos. El correo debe ser único y la contraseña se almacena hasheada.
 *     tags: [Autenticación]
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
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@correo.com
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
 *               rh:
 *                 type: string
 *                 example: "O+"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente.
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
 *                   example: 4
 *       400:
 *         description: Faltan campos requeridos.
 *       409:
 *         description: El correo ya está registrado.
 */
router.post("/register", register);

module.exports = router;
