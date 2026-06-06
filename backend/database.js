/**
 * @file database.js
 * @description Inicializa la base de datos SQLite de SaludYa mediante `node:sqlite`.
 * Crea las tablas `usuarios` y `citas` si no existen e inserta usuarios de demostración.
 * Exporta la instancia de conexión para ser usada por la API.
 * @module database
 */

const { DatabaseSync } = require("node:sqlite");

/**
 * Instancia de conexión a la base de datos SQLite.
 * El archivo `saludya.db` se crea automáticamente en el primer arranque.
 * @type {DatabaseSync}
 */
const db = new DatabaseSync("./saludya.db");

/**
 * Definición del esquema relacional.
 *
 * Tabla `usuarios`: almacena los datos de acceso y personales de pacientes, médicos
 * y administradores. El campo `email` es único.
 *
 * Tabla `citas`: registra las citas médicas, relacionadas con el paciente a través
 * de `paciente_email`.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  email TEXT UNIQUE,
  password TEXT,
  telefono TEXT,
  tipo_id TEXT,
  numero_id TEXT,
  rh TEXT
);

CREATE TABLE IF NOT EXISTS citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_email TEXT,
  especialidad TEXT,
  medico TEXT,
  fecha TEXT,
  hora TEXT
);
`);

/**
 * Sentencia preparada para insertar usuarios de demostración.
 * Usa `INSERT OR IGNORE` para no duplicar los registros en reinicios sucesivos.
 * @type {Statement}
 */
const insert = db.prepare(`
INSERT OR IGNORE INTO usuarios
(id, nombre, email, password, telefono, tipo_id, numero_id, rh)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Usuarios de demostración (uno por cada rol). El rol se infiere del correo en el frontend.
insert.run(1, "Paciente Demo", "demo@saludya.com", "123456", "3000000000", "CC", "12345678", "O+");
insert.run(2, "Administrador Demo", "admin@saludya.com", "123456", "3000000001", "CC", "11111111", "O+");
insert.run(3, "Medico Demo", "medico@saludya.com", "123456", "3000000002", "CC", "22222222", "O+");

module.exports = db;
