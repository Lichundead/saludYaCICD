/**
 * @file config.js
 * @description Configuración centralizada del backend. Todos los valores
 * pueden sobreescribirse mediante variables de entorno. En producción,
 * `validarConfigProduccion()` exige los secretos críticos.
 * @module config
 */

const { randomBytes } = require("node:crypto");

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

const config = {
  /** Entorno de ejecución: development | test | production. */
  nodeEnv,
  isProduction,
  isTest,

  /** Puerto en el que escucha el servidor. Render inyecta `PORT` en producción. */
  port: Number(process.env.PORT) || 3001,

  /** Nivel de log de pino. En pruebas se silencia. */
  logLevel: process.env.LOG_LEVEL || (isTest ? "silent" : "info"),

  /**
   * URL de PostgreSQL (p. ej. Neon) para producción.
   * Si no se define, se usa PGlite (Postgres embebido) en local.
   */
  databaseUrl: process.env.DATABASE_URL || "",

  /** SSL para la conexión Postgres (Neon lo exige). Usar "false" con una BD local sin TLS. */
  databaseSsl: process.env.DATABASE_SSL !== "false",

  /** Tamaño máximo del pool de conexiones a Postgres. */
  dbPoolMax: Number(process.env.DB_POOL_MAX) || 10,

  /** Directorio de datos de PGlite en desarrollo. Usar "memory://" en pruebas. */
  pgliteDir: process.env.PGLITE_DIR || "./pgdata",

  /** Tamaño máximo del cuerpo JSON aceptado. */
  bodyLimit: process.env.BODY_LIMIT || "10kb",

  /** Máximo de peticiones a /login, /register y /recover por IP cada 15 minutos. */
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 20,

  /** Máximo global de peticiones por IP cada 15 minutos (escudo anti abuso). */
  globalRateLimit: Number(process.env.GLOBAL_RATE_LIMIT) || 300,

  /**
   * Secreto para firmar los JWT. En producción es obligatorio (ver validación).
   * En desarrollo/pruebas se genera uno aleatorio por arranque.
   */
  jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString("hex"),

  /** Tiempo de vida de los tokens de sesión. */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",

  /** Orígenes permitidos por CORS (separados por coma en la variable de entorno). */
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:3000",
        "https://salud-ya-cicd.vercel.app",
        "https://saludyacicd-54ta.onrender.com",
      ],
};

/**
 * Valida que en producción estén definidos los secretos críticos. Sin esto,
 * la app podría arrancar con una base de datos efímera (PGlite) o con un
 * secreto JWT aleatorio que invalida las sesiones en cada reinicio.
 *
 * @throws {Error} Si falta alguna variable obligatoria en producción.
 */
function validarConfigProduccion() {
  if (!isProduction) return;

  const faltantes = [];
  if (!process.env.DATABASE_URL) faltantes.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) faltantes.push("JWT_SECRET");

  if (faltantes.length > 0) {
    throw new Error(
      `Variables de entorno obligatorias en producción ausentes: ${faltantes.join(", ")}`
    );
  }
}

module.exports = config;
module.exports.validarConfigProduccion = validarConfigProduccion;
