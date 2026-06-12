/**
 * @file fixtures.js
 * @description Datos de prueba para la suite de integración (un usuario por
 * rol + disponibilidad del médico). Solo se usa en las pruebas: el producto
 * no incluye cuentas demo.
 */

const { eq } = require("drizzle-orm");
const { hashPassword } = require("../src/passwords");
const { usuarios, disponibilidad } = require("../src/db/schema");

/**
 * Inserta los usuarios de prueba (idempotente) y bloques de disponibilidad
 * para el médico de prueba en los días hábiles de los próximos 30 días.
 * @param {object} db - Instancia de Drizzle.
 */
async function seedDatosPrueba(db) {
  const clave = hashPassword("123456");

  await db
    .insert(usuarios)
    .values([
      {
        nombre: "Paciente Demo",
        email: "demo@saludya.com",
        password: clave,
        telefono: "3000000000",
        tipo_id: "CC",
        numero_id: "12345678",
        rh: "O+",
        rol: "paciente",
      },
      {
        nombre: "Administrador Demo",
        email: "admin@saludya.com",
        password: clave,
        telefono: "3000000001",
        tipo_id: "CC",
        numero_id: "11111111",
        rh: "O+",
        rol: "admin",
      },
      {
        nombre: "Medico Demo",
        email: "medico@saludya.com",
        password: clave,
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

  const [medico] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, "medico@saludya.com"));

  if (medico) {
    const bloques = [];
    const hoy = new Date();

    for (let i = 0; i < 30; i++) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const diaSemana = dia.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
      bloques.push(
        { medico_id: medico.id, fecha, hora_inicio: "08:00", hora_fin: "12:00" },
        { medico_id: medico.id, fecha, hora_inicio: "14:00", hora_fin: "17:00" }
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

module.exports = { seedDatosPrueba };
