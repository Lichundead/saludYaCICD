/**
 * @file seed.js
 * @description Datos de demostración (un usuario por rol). Idempotente:
 * usa ON CONFLICT DO NOTHING sobre el correo, así que puede ejecutarse
 * en cada arranque sin duplicar registros.
 *
 * Ejecutable también como script: `pnpm db:seed`.
 * @module db/seed
 */

const { eq } = require("drizzle-orm");
const { hashPassword } = require("../passwords");
const { usuarios, disponibilidad } = require("./schema");

/**
 * Inserta los usuarios de demostración si no existen, y bloques de
 * disponibilidad para el médico demo (días hábiles de los próximos 30 días).
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

  // Disponibilidad demo: días hábiles de los próximos 30 días,
  // mañana (08:00-12:00) y tarde (14:00-17:00).
  const [medicoDemo] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, "medico@saludya.com"));

  if (medicoDemo) {
    const bloques = [];
    const hoy = new Date();

    for (let i = 0; i < 30; i++) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const diaSemana = dia.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
      bloques.push(
        { medico_id: medicoDemo.id, fecha, hora_inicio: "08:00", hora_fin: "12:00" },
        { medico_id: medicoDemo.id, fecha, hora_inicio: "14:00", hora_fin: "17:00" }
      );
    }

    await db
      .insert(disponibilidad)
      .values(bloques)
      .onConflictDoNothing({
        target: [disponibilidad.medico_id, disponibilidad.fecha, disponibilidad.hora_inicio],
      });
  }
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
