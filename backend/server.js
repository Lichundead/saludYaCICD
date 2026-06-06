/**
 * @file server.js
 * @description Punto de entrada de la API REST de SaludYa.
 * Configura el servidor Express, el middleware (CORS, JSON), la documentación
 * Swagger y registra los endpoints de autenticación, usuarios y citas.
 * @module server
 */

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const db = require("./database");
const swaggerSpec = require("./swagger");

const app = express();

/**
 * Middleware de CORS. Permite peticiones desde el frontend local
 * (http://localhost:3000) y desde el despliegue de Vercel.
 */
app.use(
  cors({
    origin: ["http://localhost:3000", "https://salud-ya-cicd.vercel.app"],
    credentials: true,
  })
);

/** Middleware para parsear automáticamente el cuerpo de las peticiones en formato JSON. */
app.use(express.json());

/**
 * Documentación interactiva de la API (Swagger UI).
 * Disponible en GET /api-docs.
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * tags:
 *   - name: Autenticación
 *     description: Inicio de sesión y registro de usuarios
 *   - name: Usuarios
 *     description: Consulta de datos de usuarios
 *   - name: Citas
 *     description: Creación y consulta de citas médicas
 */

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
 *         description: Resultado de la autenticación.
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
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * Autentica a un usuario validando su correo y contraseña.
 *
 * @function loginHandler
 * @param {express.Request} req - Petición HTTP. `req.body` debe contener `email` y `password`.
 * @param {express.Response} res - Respuesta HTTP en formato JSON.
 * @returns {void} Responde `{ success: true, user }` si las credenciales son válidas,
 *                 `{ success: false }` en caso contrario.
 */
app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare(`SELECT * FROM usuarios WHERE email = ? AND password = ?`)
      .get(email, password);

    if (user) {
      return res.json({ success: true, user });
    }

    res.json({ success: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     description: Crea un usuario (paciente) en la base de datos. El correo debe ser único.
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
 *       200:
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
 */

/**
 * Registra un nuevo usuario en la tabla `usuarios`.
 *
 * @function registerHandler
 * @param {express.Request} req - Petición HTTP cuyo `req.body` contiene los datos del usuario.
 * @param {express.Response} res - Respuesta HTTP en formato JSON.
 * @returns {void} Responde `{ success: true, id }` con el id generado, o `{ success: false }` si falla
 *                 (por ejemplo, si el correo ya existe).
 */
app.post("/register", (req, res) => {
  try {
    const { nombre, email, password, telefono, tipo_id, numero_id, rh } =
      req.body;

    const result = db
      .prepare(
        `INSERT INTO usuarios
         (nombre, email, password, telefono, tipo_id, numero_id, rh)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(nombre, email, password, telefono, tipo_id, numero_id, rh);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

/**
 * @openapi
 * /usuario/{email}:
 *   get:
 *     summary: Obtiene un usuario por su correo
 *     tags: [Usuarios]
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
 */

/**
 * Obtiene los datos de un usuario a partir de su correo electrónico.
 *
 * @function getUsuarioHandler
 * @param {express.Request} req - Petición HTTP. `req.params.email` es el correo a buscar.
 * @param {express.Response} res - Respuesta HTTP en formato JSON.
 * @returns {void} Responde `{ success: true, user }` con el usuario (o `undefined` si no existe).
 */
app.get("/usuario/:email", (req, res) => {
  try {
    const user = db
      .prepare(`SELECT * FROM usuarios WHERE email = ?`)
      .get(req.params.email);

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

/**
 * @openapi
 * /citas:
 *   post:
 *     summary: Crea una nueva cita médica
 *     tags: [Citas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paciente_email, especialidad, medico, fecha, hora]
 *             properties:
 *               paciente_email:
 *                 type: string
 *                 format: email
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
 *       200:
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
 */

/**
 * Crea una nueva cita médica en la tabla `citas`.
 *
 * @function crearCitaHandler
 * @param {express.Request} req - Petición HTTP cuyo `req.body` contiene los datos de la cita.
 * @param {express.Response} res - Respuesta HTTP en formato JSON.
 * @returns {void} Responde `{ success: true, id }` con el id de la cita creada o `{ success: false }`.
 */
app.post("/citas", (req, res) => {
  try {
    const { paciente_email, especialidad, medico, fecha, hora } = req.body;

    const result = db
      .prepare(
        `INSERT INTO citas
         (paciente_email, especialidad, medico, fecha, hora)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(paciente_email, especialidad, medico, fecha, hora);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

/**
 * @openapi
 * /citas/{email}:
 *   get:
 *     summary: Lista las citas de un paciente
 *     tags: [Citas]
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
 */

/**
 * Obtiene todas las citas asociadas al correo de un paciente.
 *
 * @function getCitasHandler
 * @param {express.Request} req - Petición HTTP. `req.params.email` es el correo del paciente.
 * @param {express.Response} res - Respuesta HTTP en formato JSON.
 * @returns {void} Responde `{ success: true, citas }` con el arreglo de citas (vacío si no hay).
 */
app.get("/citas/:email", (req, res) => {
  try {
    const citas = db
      .prepare(`SELECT * FROM citas WHERE paciente_email = ?`)
      .all(req.params.email);

    res.json({ success: true, citas });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

/** Puerto en el que escucha el servidor. Render inyecta `process.env.PORT` en producción. */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Documentación Swagger disponible en /api-docs`);
});

module.exports = app;
