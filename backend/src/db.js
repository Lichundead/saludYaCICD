/**
 * @file db.js
 * @description Inicializa la base de datos SQLite de SaludYa mediante `node:sqlite`.
 * Crea las tablas `usuarios` y `citas` si no existen e inserta usuarios de demostración.
 * Exporta la instancia de conexión para ser usada por los controladores.
 * @module db
 */

const { DatabaseSync } = require("node:sqlite");
const config = require("./config");
const { hashPassword } = require("./passwords");

/**
 * Instancia de conexión a la base de datos SQLite.
 * El archivo se crea automáticamente en el primer arranque
 * (o se usa una base en memoria si `DB_PATH=":memory:"`).
 * @type {DatabaseSync}
 */
const db = new DatabaseSync(config.dbPath);

/**
 * Esquema relacional.
 *
 * Tabla `usuarios`: datos de acceso y personales de pacientes, médicos y
 * administradores. El campo `email` es único y `password` guarda el hash scrypt.
 *
 * Tabla `citas`: citas médicas relacionadas con el paciente vía `paciente_email`.
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
  rh TEXT,
  rol TEXT NOT NULL DEFAULT 'paciente'
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
 * Migración para bases de datos creadas antes de la columna `rol`:
 * la añade y asigna el rol correcto a los usuarios de demostración.
 */
const columnas = db.prepare(`PRAGMA table_info(usuarios)`).all();
if (!columnas.some((col) => col.name === "rol")) {
  db.exec(`ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'paciente'`);
  db.exec(`UPDATE usuarios SET rol = 'admin' WHERE email = 'admin@saludya.com'`);
  db.exec(`UPDATE usuarios SET rol = 'medico' WHERE email = 'medico@saludya.com'`);
}

/**
 * Inserta los usuarios de demostración (uno por rol). Usa `INSERT OR IGNORE`
 * para no duplicar registros en reinicios sucesivos.
 */
const insert = db.prepare(`
INSERT OR IGNORE INTO usuarios
(id, nombre, email, password, telefono, tipo_id, numero_id, rh, rol)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const demoPassword = hashPassword("123456");
insert.run(1, "Paciente Demo", "demo@saludya.com", demoPassword, "3000000000", "CC", "12345678", "O+", "paciente");
insert.run(2, "Administrador Demo", "admin@saludya.com", demoPassword, "3000000001", "CC", "11111111", "O+", "admin");
insert.run(3, "Medico Demo", "medico@saludya.com", demoPassword, "3000000002", "CC", "22222222", "O+", "medico");

module.exports = db;
