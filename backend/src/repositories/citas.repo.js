/**
 * @file citas.repo.js
 * @description Acceso a datos de la tabla `citas`. Las consultas de lectura
 * unen con `usuarios` (dos veces, con alias) para devolver el correo y nombre
 * del paciente y el nombre del médico, conservando el contrato de la API.
 * @module repositories/citas
 */

const { eq } = require("drizzle-orm");
const { alias } = require("drizzle-orm/pg-core");
const { getDb } = require("../db/client");
const { citas, usuarios } = require("../db/schema");

const pacientes = alias(usuarios, "pacientes");
const medicos = alias(usuarios, "medicos");

/** Proyección común de una cita con los datos de paciente y médico. */
function seleccionarCitas() {
  return getDb()
    .select({
      id: citas.id,
      paciente_id: citas.paciente_id,
      medico_id: citas.medico_id,
      especialidad: citas.especialidad,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
      paciente_email: pacientes.email,
      paciente_nombre: pacientes.nombre,
      medico: medicos.nombre,
    })
    .from(citas)
    .innerJoin(pacientes, eq(citas.paciente_id, pacientes.id))
    .innerJoin(medicos, eq(citas.medico_id, medicos.id));
}

/**
 * Crea una cita. El índice único (medico, fecha, hora) puede lanzar una
 * violación de unicidad que el controlador traduce a 409.
 * @param {object} datos - { paciente_id, medico_id, especialidad, fecha, hora }
 * @returns {Promise<object>} La fila insertada.
 */
async function crear(datos) {
  const [cita] = await getDb().insert(citas).values(datos).returning();
  return cita;
}

/**
 * Lista las citas de un paciente identificado por su correo.
 * @param {string} email
 * @returns {Promise<object[]>}
 */
function listarPorPacienteEmail(email) {
  return seleccionarCitas()
    .where(eq(pacientes.email, email))
    .orderBy(citas.fecha, citas.hora);
}

/**
 * Lista las citas del sistema (paneles de médico y admin).
 * @param {number} [medicoId] - Si se indica, solo las citas de ese médico.
 * @returns {Promise<object[]>}
 */
function listarTodas(medicoId) {
  let consulta = seleccionarCitas();
  if (medicoId) {
    consulta = consulta.where(eq(citas.medico_id, medicoId));
  }
  return consulta.orderBy(citas.fecha, citas.hora);
}

/**
 * Actualiza el estado de una cita.
 * @param {number} id
 * @param {string} estado
 * @returns {Promise<object|undefined>} La fila actualizada, o undefined si no existe.
 */
async function actualizarEstado(id, estado) {
  const [cita] = await getDb()
    .update(citas)
    .set({ estado })
    .where(eq(citas.id, id))
    .returning();
  return cita;
}

module.exports = { crear, listarPorPacienteEmail, listarTodas, actualizarEstado };
