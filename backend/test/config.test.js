/**
 * @file config.test.js
 * @description Verifica la validación de configuración de producción.
 * Se ejecuta en un proceso aislado con NODE_ENV=production.
 */

process.env.NODE_ENV = "production";
delete process.env.DATABASE_URL;
delete process.env.JWT_SECRET;

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { validarConfigProduccion } = require("../src/config");

test("exige DATABASE_URL y JWT_SECRET en producción", () => {
  assert.throws(() => validarConfigProduccion(), /DATABASE_URL/);
});

test("no lanza cuando los secretos críticos están definidos", () => {
  process.env.DATABASE_URL = "postgres://usuario:clave@host/db";
  process.env.JWT_SECRET = "un-secreto-de-produccion";
  assert.doesNotThrow(() => validarConfigProduccion());
});
