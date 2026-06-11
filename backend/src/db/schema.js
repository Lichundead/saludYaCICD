/**
 * @file schema.js
 * @description Esquema relacional de SaludYa declarado con Drizzle ORM (PostgreSQL).
 * Las claves JS coinciden con los nombres de columna (snake_case) para que las
 * filas devueltas conserven el contrato actual de la API.
 * @module db/schema
 */

const { sql } = require("drizzle-orm");
const {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  uniqueIndex,
  check,
} = require("drizzle-orm/pg-core");

/**
 * Tabla `usuarios`: pacientes, médicos y administradores.
 * El rol está restringido por CHECK y el correo es único (se almacena en minúsculas).
 */
const usuarios = pgTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    telefono: text("telefono"),
    tipo_id: text("tipo_id"),
    numero_id: text("numero_id"),
    rh: text("rh"),
    rol: text("rol").notNull().default("paciente"),
    especialidad: text("especialidad"),
    licencia: text("licencia"),
    // Cuentas creadas por el admin con contraseña temporal: el usuario
    // debe definir la suya en el primer ingreso.
    debe_cambiar_password: boolean("debe_cambiar_password").notNull().default(false),
  },
  (tabla) => [
    check(
      "usuarios_rol_valido",
      sql`${tabla.rol} IN ('paciente', 'medico', 'admin')`
    ),
  ]
);

/**
 * Tabla `citas`: relaciona paciente y médico por clave foránea.
 * El índice único (medico, fecha, hora) impide la doble asignación de horarios
 * a nivel de base de datos, incluso ante peticiones concurrentes.
 */
const citas = pgTable(
  "citas",
  {
    id: serial("id").primaryKey(),
    paciente_id: integer("paciente_id")
      .notNull()
      .references(() => usuarios.id),
    medico_id: integer("medico_id")
      .notNull()
      .references(() => usuarios.id),
    especialidad: text("especialidad").notNull(),
    fecha: date("fecha", { mode: "string" }).notNull(),
    hora: text("hora").notNull(),
    estado: text("estado").notNull().default("pendiente"),
  },
  (tabla) => [
    uniqueIndex("citas_medico_horario_unico").on(
      tabla.medico_id,
      tabla.fecha,
      tabla.hora
    ),
    check(
      "citas_estado_valido",
      sql`${tabla.estado} IN ('pendiente', 'confirmada', 'rechazada', 'atendida')`
    ),
  ]
);

/**
 * Tabla `disponibilidad`: bloques de atención que cada médico define
 * (fecha + rango horario). Los slots de 30 minutos para agendar citas
 * se derivan de estos bloques.
 */
const disponibilidad = pgTable(
  "disponibilidad",
  {
    id: serial("id").primaryKey(),
    medico_id: integer("medico_id")
      .notNull()
      .references(() => usuarios.id),
    fecha: date("fecha", { mode: "string" }).notNull(),
    hora_inicio: text("hora_inicio").notNull(),
    hora_fin: text("hora_fin").notNull(),
  },
  (tabla) => [
    uniqueIndex("disponibilidad_bloque_unico").on(
      tabla.medico_id,
      tabla.fecha,
      tabla.hora_inicio
    ),
  ]
);

module.exports = { usuarios, citas, disponibilidad };
