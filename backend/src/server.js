/**
 * @file server.js
 * @description Punto de entrada de la API REST de SaludYa. Valida la
 * configuración, inicializa la base de datos (migraciones + datos demo),
 * levanta el servidor y gestiona el apagado ordenado.
 * @module server
 */

const app = require("./app");
const config = require("./config");
const logger = require("./logger");
const { initDb, closeDb } = require("./db/client");
const { seedDemoData } = require("./db/seed");
const { validarConfigProduccion } = require("./config");

async function arrancar() {
  // Falla rápido si faltan secretos críticos en producción.
  validarConfigProduccion();

  const db = await initDb();
  await seedDemoData(db);

  const server = app.listen(config.port, () => {
    logger.info(
      {
        puerto: config.port,
        entorno: config.nodeEnv,
        baseDatos: config.databaseUrl ? "postgresql" : `pglite (${config.pgliteDir})`,
      },
      "SaludYa API en línea"
    );
  });

  // Tiempos de keep-alive holgados respecto al proxy para evitar 502 esporádicos.
  server.keepAliveTimeout = 61_000;
  server.headersTimeout = 65_000;

  /** Cierra el servidor HTTP y la base de datos antes de salir. */
  async function apagar(senal) {
    logger.info({ senal }, "Apagando SaludYa API...");
    server.close(async () => {
      await closeDb();
      logger.info("Recursos liberados, hasta luego");
      process.exit(0);
    });
    // Salida forzada si algo se cuelga durante el cierre.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => apagar("SIGTERM"));
  process.on("SIGINT", () => apagar("SIGINT"));
}

arrancar().catch((error) => {
  logger.error({ err: error }, "No se pudo iniciar la API");
  process.exit(1);
});
