/**
 * @file server.js
 * @description Punto de entrada de la API REST de SaludYa.
 * Inicializa la base de datos (migraciones + datos demo) y levanta el servidor.
 * @module server
 */

const app = require("./app");
const config = require("./config");
const { initDb } = require("./db/client");
const { seedDemoData } = require("./db/seed");

initDb()
  .then(async (db) => {
    await seedDemoData(db);

    app.listen(config.port, () => {
      console.log(`Servidor corriendo en puerto ${config.port}`);
      console.log(`Documentación Swagger disponible en /api-docs`);
      console.log(
        config.databaseUrl
          ? "Base de datos: PostgreSQL (DATABASE_URL)"
          : `Base de datos: PGlite local (${config.pgliteDir})`
      );
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar la base de datos:", error);
    process.exit(1);
  });
