/**
 * @file seed.js
 * @description Datos de demostración (un usuario por rol). Idempotente:
 * usa ON CONFLICT DO NOTHING sobre el correo, así que puede ejecutarse
 * en cada arranque sin duplicar registros.
 *
 * Ejecutable también como script: `pnpm db:seed`.
 * @module db/seed
 */

const { hashPassword } = require("../passwords");
const { usuarios } = require("./schema");

/**
 * Inserta los usuarios de demostración si no existen.
 * @param {object} db - Instancia de Drizzle.
 */
async function seedDemoData(db) {
  const demoPassword = hashPassword("123456");

  await db
    .insert(usuarios)
    .values([
      {
        nombre: "Paciente Demo",
        email: "demo@saludya.com",
        password: demoPassword,
        telefono: "3000000000",
        tipo_id: "CC",
        numero_id: "12345678",
        rh: "O+",
        rol: "paciente",
      },
      {
        nombre: "Administrador Demo",
        email: "admin@saludya.com",
        password: demoPassword,
        telefono: "3000000001",
        tipo_id: "CC",
        numero_id: "11111111",
        rh: "O+",
        rol: "admin",
      },
      {
        nombre: "Medico Demo",
        email: "medico@saludya.com",
        password: demoPassword,
        telefono: "3000000002",
        tipo_id: "CC",
        numero_id: "22222222",
        rh: "O+",
        rol: "medico",
        especialidad: "Medicina general",
        licencia: "RM-0001",
      },
    ])
    .onConflictDoNothing({ target: usuarios.email });
}

module.exports = { seedDemoData };

// Permite ejecutar el seed directamente: `pnpm db:seed`
if (require.main === module) {
  const { initDb, closeDb } = require("./client");

  initDb()
    .then(seedDemoData)
    .then(async () => {
      console.log("Datos de demostración insertados");
      await closeDb();
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
