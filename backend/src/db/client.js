/**
 * @file client.js
 * @description Conexión a la base de datos y aplicación de migraciones.
 *
 * - Con `DATABASE_URL` definida (producción): PostgreSQL gestionado (p. ej. Neon)
 *   mediante el driver `pg`.
 * - Sin `DATABASE_URL` (desarrollo y pruebas): PGlite, un Postgres embebido que
 *   persiste en `PGLITE_DIR` o corre en memoria con `PGLITE_DIR=memory://`.
 *
 * Las migraciones versionadas de `drizzle/` se aplican automáticamente al iniciar.
 * @module db/client
 */

const path = require("node:path");
const { sql } = require("drizzle-orm");
const config = require("../config");
const schema = require("./schema");

const MIGRATIONS_FOLDER = path.join(__dirname, "..", "..", "drizzle");

let db = null;
let conexion = null;
let initPromise = null;

async function crearConexion() {
  if (config.databaseUrl) {
    const { Pool } = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");
    const { migrate } = require("drizzle-orm/node-postgres/migrator");

    conexion = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: config.dbPoolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    db = drizzle(conexion, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } else {
    // PGlite es ESM puro: se carga con import() dinámico desde CommonJS.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = require("drizzle-orm/pglite");
    const { migrate } = require("drizzle-orm/pglite/migrator");

    conexion =
      config.pgliteDir === "memory://" ? new PGlite() : new PGlite(config.pgliteDir);

    db = drizzle(conexion, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  }

  return db;
}

/**
 * Inicializa la conexión y aplica las migraciones pendientes (idempotente).
 * @returns {Promise<object>} Instancia de Drizzle lista para usar.
 */
function initDb() {
  initPromise ??= crearConexion();
  return initPromise;
}

/**
 * Devuelve la instancia de Drizzle ya inicializada.
 * @throws {Error} Si se llama antes de `initDb()`.
 */
function getDb() {
  if (!db) {
    throw new Error("La base de datos no está inicializada: llama a initDb() primero");
  }
  return db;
}

/**
 * Comprueba la conectividad con la base de datos (usado por /health).
 * @returns {Promise<boolean>} true si la base responde.
 */
async function ping() {
  try {
    if (!db) return false;
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cierra la conexión de forma ordenada (pool de pg o instancia PGlite).
 * Necesario antes de `process.exit()` en scripts puntuales y en el apagado.
 */
async function closeDb() {
  if (conexion?.end) {
    await conexion.end();
  } else if (conexion?.close) {
    await conexion.close();
  }
  db = null;
  conexion = null;
  initPromise = null;
}

module.exports = { initDb, getDb, ping, closeDb };
