/**
 * @file app.js
 * @description Construye y configura la aplicación Express de SaludYa:
 * seguridad (helmet, CORS, rate limiting), compresión, logging de peticiones,
 * rutas y manejo de errores. Se exporta sin levantar el servidor para poder
 * usarla en las pruebas.
 * @module app
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

const config = require("./config");
const logger = require("./logger");
const { ping } = require("./db/client");
const authRoutes = require("./routes/auth.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const citasRoutes = require("./routes/citas.routes");
const disponibilidadRoutes = require("./routes/disponibilidad.routes");

const app = express();

/** Render sirve la API detrás de un proxy: confiar en el primer salto
 * para que el rate limiting identifique la IP real del cliente. */
app.set("trust proxy", 1);

/** No revelar el motor del servidor. */
app.disable("x-powered-by");

/** Enmascara correos (PII) que viajan en la URL para no registrarlos. */
const EMAIL_EN_URL = /[^/\s@]+@[^/\s@]+\.[^/\s@]+/g;
function urlSinPII(url) {
  return typeof url === "string" ? url.replace(EMAIL_EN_URL, "***") : url;
}

/**
 * Logging estructurado de cada petición. Serializadores compactos: solo
 * método, URL (con correos enmascarados) y código de estado. No se registran
 * cuerpos ni cabeceras, así no se filtran contraseñas, tokens ni datos
 * personales.
 */
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/health" },
    serializers: {
      req(req) {
        return { method: req.method, url: urlSinPII(req.url) };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

/** Cabeceras de seguridad (la API solo sirve JSON). */
app.use(helmet());

/** Compresión gzip de las respuestas. */
app.use(compression());

/** Middleware de CORS. Los orígenes permitidos se definen en la configuración. */
app.use(cors({ origin: config.corsOrigins }));

/** Parseo del cuerpo JSON, limitado para evitar payloads abusivos. */
app.use(express.json({ limit: config.bodyLimit }));

/** Escudo global anti abuso: tope de peticiones por IP. */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.globalRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Demasiadas peticiones, intenta más tarde" },
  })
);

/** Límite más estricto en los endpoints de autenticación (anti fuerza bruta). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos, intenta más tarde" },
});
app.use(["/login", "/register", "/recover"], authLimiter);

/** Verifica que la API y la base de datos respondan (health check). */
app.get("/health", async (req, res) => {
  const dbOk = await ping();
  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "up" : "down",
  });
});

app.use(authRoutes);
app.use(usuariosRoutes);
app.use(citasRoutes);
app.use(disponibilidadRoutes);

/** Manejador 404 para rutas no registradas. */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

/** Manejador central de errores: registra el error y responde 500 genérico. */
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  (req.log || logger).error({ err: error }, "Error no controlado");
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor" });
});

module.exports = app;
