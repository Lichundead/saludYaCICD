/**
 * @file logger.js
 * @description Logger estructurado (pino) compartido por toda la app.
 * El nivel se toma de la configuración (silenciado en pruebas). En producción
 * emite JSON, ideal para los agregadores de logs de Render/hosting.
 * @module logger
 */

const pino = require("pino");
const config = require("./config");

const logger = pino({
  level: config.logLevel,
  // No registrar campos de entorno sensibles por accidente.
  base: { service: "saludya-api" },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true,
  },
});

module.exports = logger;
