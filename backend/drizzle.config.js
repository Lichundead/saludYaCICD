/**
 * Configuración de drizzle-kit: genera las migraciones SQL versionadas
 * en `drizzle/` a partir del esquema declarado en `src/db/schema.js`.
 * Uso: `pnpm db:generate`
 */

const { defineConfig } = require("drizzle-kit");

module.exports = defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
});
