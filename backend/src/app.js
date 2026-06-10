/**
 * @file app.js
 * @description Construye y configura la aplicación Express de SaludYa:
 * middleware (CORS, JSON), documentación Swagger, rutas y manejo de errores.
 * Se exporta sin levantar el servidor para poder usarla en las pruebas.
 * @module app
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const config = require("./config");
const swaggerSpec = require("./swagger");
const authRoutes = require("./routes/auth.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const citasRoutes = require("./routes/citas.routes");

const app = express();

/** Render sirve la API detrás de un proxy: confiar en el primer salto
 * para que el rate limiting identifique la IP real del cliente. */
app.set("trust proxy", 1);

/** Cabeceras de seguridad. La CSP se desactiva porque rompe Swagger UI
 * y la API solo sirve JSON (no hay HTML propio que proteger). */
app.use(helmet({ contentSecurityPolicy: false }));

/** Middleware de CORS. Los orígenes permitidos se definen en la configuración. */
app.use(cors({ origin: config.corsOrigins }));

/** Parseo del cuerpo JSON, limitado para evitar payloads abusivos. */
app.use(express.json({ limit: "10kb" }));

/** Límite de intentos en los endpoints de autenticación (anti fuerza bruta). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos, intenta más tarde" },
});
app.use(["/login", "/register"], authLimiter);

/**
 * Documentación interactiva de la API (Swagger UI).
 * Disponible en GET /api-docs.
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica que la API esté en línea
 *     tags: [Salud]
 *     responses:
 *       200:
 *         description: La API responde correctamente.
 */
app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use(authRoutes);
app.use(usuariosRoutes);
app.use(citasRoutes);

/** Manejador 404 para rutas no registradas. */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

/** Manejador central de errores: registra el error y responde 500. */
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor" });
});

module.exports = app;
