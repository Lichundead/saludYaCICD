/**
 * @file config.js
 * @description Configuración centralizada del backend. Todos los valores
 * pueden sobreescribirse mediante variables de entorno.
 * @module config
 */

const { randomBytes } = require("node:crypto");

const config = {
  /** Puerto en el que escucha el servidor. Render inyecta `PORT` en producción. */
  port: process.env.PORT || 3001,

  /** Ruta del archivo SQLite. Usar ":memory:" para pruebas. */
  dbPath: process.env.DB_PATH || "./saludya.db",

  /** Máximo de peticiones a /login y /register por IP cada 15 minutos. */
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 20,

  /**
   * Secreto para firmar los JWT. Si no se define `JWT_SECRET`, se genera uno
   * aleatorio por arranque (seguro por defecto, pero invalida las sesiones
   * al reiniciar: en producción definir la variable de entorno).
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

module.exports = config;
