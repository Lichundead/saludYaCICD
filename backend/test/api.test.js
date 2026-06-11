/**
 * @file api.test.js
 * @description Pruebas de integración de la API de SaludYa usando `node:test`
 * y el `fetch` nativo de Node contra PGlite (PostgreSQL embebido) en memoria.
 */

// Postgres embebido en memoria: mismo dialecto que producción, sin servicios.
process.env.PGLITE_DIR = "memory://";
// Límite alto para que el rate limiting no interfiera con la suite.
process.env.AUTH_RATE_LIMIT = "1000";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { initDb } = require("../src/db/client");
const { seedDemoData } = require("../src/db/seed");

let server;
let baseUrl;
let tokenPaciente;
let tokenAdmin;
let tokenMedico;
let medicoDemoId;

/** Helper para hacer peticiones JSON a la API de prueba. */
async function api(path, { token, ...options } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, { headers, ...options });
  return { status: res.status, body: await res.json() };
}

function login(email, password) {
  return api("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

before(async () => {
  const db = await initDb();
  await seedDemoData(db);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  tokenPaciente = (await login("demo@saludya.com", "123456")).body.token;
  tokenAdmin = (await login("admin@saludya.com", "123456")).body.token;
  tokenMedico = (await login("medico@saludya.com", "123456")).body.token;

  const medicos = await api("/medicos", { token: tokenPaciente });
  medicoDemoId = medicos.body.medicos[0].id;
});

after(() => {
  server.close();
});

test("GET /health responde ok", async () => {
  const { status, body } = await api("/health");
  assert.equal(status, 200);
  assert.equal(body.success, true);
});

test("las respuestas incluyen cabeceras de seguridad (helmet)", async () => {
  const res = await fetch(`${baseUrl}/health`);

  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("POST /login devuelve token y rol, sin exponer la contraseña", async () => {
  const { status, body } = await login("demo@saludya.com", "123456");

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.user.email, "demo@saludya.com");
  assert.equal(body.user.rol, "paciente");
  assert.equal(body.user.password, undefined);
  assert.ok(typeof body.token === "string" && body.token.length > 0);
});

test("POST /login rechaza credenciales inválidas con 401", async () => {
  const { status, body } = await login("demo@saludya.com", "incorrecta");

  assert.equal(status, 401);
  assert.equal(body.success, false);
});

test("POST /login exige correo y contraseña", async () => {
  const { status, body } = await api("/login", {
    method: "POST",
    body: JSON.stringify({ email: "demo@saludya.com" }),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test("POST /register crea un paciente (ignora el rol del cliente) y permite iniciar sesión", async () => {
  const registro = await api("/register", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Nuevo Paciente",
      email: "nuevo@saludya.com",
      password: "claveSegura",
      telefono: "3001112233",
      tipo_id: "CC",
      numero_id: "1090123456",
      rh: "O+",
      rol: "admin",
    }),
  });

  assert.equal(registro.status, 201);
  assert.equal(registro.body.success, true);

  const sesion = await login("nuevo@saludya.com", "claveSegura");

  assert.equal(sesion.status, 200);
  assert.equal(sesion.body.user.rol, "paciente");
});

test("POST /register rechaza correos con formato inválido", async () => {
  const { status, body } = await api("/register", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Correo Malo",
      email: "no-es-un-correo",
      password: "123456",
    }),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test("POST /register rechaza correos duplicados con 409", async () => {
  const { status, body } = await api("/register", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Duplicado",
      email: "demo@saludya.com",
      password: "123456",
    }),
  });

  assert.equal(status, 409);
  assert.equal(body.success, false);
});

test("el registro y el login no distinguen mayúsculas en el correo", async () => {
  const registro = await api("/register", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Mayusculas",
      email: "MAYUS@SaludYa.com",
      password: "123456",
    }),
  });
  assert.equal(registro.status, 201);

  const sesion = await login("mayus@saludya.com", "123456");
  assert.equal(sesion.status, 200);
});

test("GET /usuario/:email exige token (401 sin autenticación)", async () => {
  const { status } = await api("/usuario/demo@saludya.com");
  assert.equal(status, 401);
});

test("GET /usuario/:email rechaza tokens inválidos", async () => {
  const { status } = await api("/usuario/demo@saludya.com", {
    token: "token-falso",
  });
  assert.equal(status, 401);
});

test("un paciente puede consultar su propio perfil, sin contraseña", async () => {
  const { status, body } = await api("/usuario/demo@saludya.com", {
    token: tokenPaciente,
  });

  assert.equal(status, 200);
  assert.equal(body.user.nombre, "Paciente Demo");
  assert.equal(body.user.password, undefined);
});

test("un paciente NO puede consultar el perfil de otro usuario (403)", async () => {
  const { status, body } = await api("/usuario/admin@saludya.com", {
    token: tokenPaciente,
  });

  assert.equal(status, 403);
  assert.equal(body.success, false);
});

test("un admin puede consultar cualquier perfil", async () => {
  const { status, body } = await api("/usuario/demo@saludya.com", {
    token: tokenAdmin,
  });

  assert.equal(status, 200);
  assert.equal(body.user.email, "demo@saludya.com");
});

test("GET /usuario/:email responde 404 si no existe", async () => {
  const { status } = await api("/usuario/noexiste@saludya.com", {
    token: tokenAdmin,
  });
  assert.equal(status, 404);
});

test("PUT /usuario/:email actualiza el perfil propio sin tocar correo ni rol", async () => {
  const { status, body } = await api("/usuario/demo@saludya.com", {
    method: "PUT",
    token: tokenPaciente,
    body: JSON.stringify({ nombre: "Paciente Actualizado", telefono: "3119998877" }),
  });

  assert.equal(status, 200);
  assert.equal(body.user.nombre, "Paciente Actualizado");
  assert.equal(body.user.telefono, "3119998877");
  assert.equal(body.user.email, "demo@saludya.com");
  assert.equal(body.user.rol, "paciente");

  const consulta = await api("/usuario/demo@saludya.com", { token: tokenPaciente });
  assert.equal(consulta.body.user.nombre, "Paciente Actualizado");
});

test("un paciente NO puede actualizar el perfil de otro (403)", async () => {
  const { status } = await api("/usuario/admin@saludya.com", {
    method: "PUT",
    token: tokenPaciente,
    body: JSON.stringify({ nombre: "Hackeado" }),
  });
  assert.equal(status, 403);
});

test("POST /medicos crea una cuenta de médico (solo admin) y permite su login", async () => {
  const creacion = await api("/medicos", {
    method: "POST",
    token: tokenAdmin,
    body: JSON.stringify({
      nombre: "Paula García",
      email: "paula@saludya.com",
      password: "claveMedico",
      telefono: "3005556677",
      especialidad: "Pediatría",
      licencia: "RM-12345",
    }),
  });

  assert.equal(creacion.status, 201);

  const sesion = await login("paula@saludya.com", "claveMedico");
  assert.equal(sesion.status, 200);
  assert.equal(sesion.body.user.rol, "medico");
  assert.equal(sesion.body.user.especialidad, "Pediatría");
});

test("POST /medicos rechaza a pacientes (403) y a anónimos (401)", async () => {
  const comoPaciente = await api("/medicos", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({ nombre: "X", email: "x@x.com", password: "123456" }),
  });
  assert.equal(comoPaciente.status, 403);

  const sinToken = await api("/medicos", {
    method: "POST",
    body: JSON.stringify({ nombre: "X", email: "x@x.com", password: "123456" }),
  });
  assert.equal(sinToken.status, 401);
});

test("GET /medicos: el admin ve todo; el paciente solo id, nombre y especialidad", async () => {
  const comoAdmin = await api("/medicos", { token: tokenAdmin });

  assert.equal(comoAdmin.status, 200);
  const correos = comoAdmin.body.medicos.map((m) => m.email);
  assert.ok(correos.includes("paula@saludya.com"));
  assert.ok(comoAdmin.body.medicos.every((m) => m.password === undefined));

  const comoPaciente = await api("/medicos", { token: tokenPaciente });

  assert.equal(comoPaciente.status, 200);
  assert.ok(comoPaciente.body.medicos.length >= 2);
  for (const medico of comoPaciente.body.medicos) {
    assert.deepEqual(Object.keys(medico).sort(), ["especialidad", "id", "nombre"]);
  }
});

test("POST /citas exige token (401 sin autenticación)", async () => {
  const { status } = await api("/citas", {
    method: "POST",
    body: JSON.stringify({
      medico_id: 1,
      especialidad: "Medicina general",
      fecha: "2026-06-15",
      hora: "09:30",
    }),
  });

  assert.equal(status, 401);
});

test("un paciente crea citas a su propio nombre aunque envíe otro correo", async () => {
  const creacion = await api("/citas", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({
      paciente_email: "otro@saludya.com",
      medico_id: medicoDemoId,
      especialidad: "Medicina general",
      fecha: "2026-06-15",
      hora: "09:30",
    }),
  });

  assert.equal(creacion.status, 201);

  const listado = await api("/citas/demo@saludya.com", { token: tokenPaciente });

  assert.equal(listado.status, 200);
  assert.equal(listado.body.citas.length, 1);
  assert.equal(listado.body.citas[0].paciente_email, "demo@saludya.com");
  assert.equal(listado.body.citas[0].medico, "Medico Demo");
  assert.equal(listado.body.citas[0].estado, "pendiente");
});

test("la base de datos impide el doble agendamiento del mismo horario (409)", async () => {
  const { status, body } = await api("/citas", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({
      medico_id: medicoDemoId,
      especialidad: "Medicina general",
      fecha: "2026-06-15",
      hora: "09:30",
    }),
  });

  assert.equal(status, 409);
  assert.equal(body.success, false);
});

test("POST /citas rechaza médicos inexistentes o que no son médicos", async () => {
  const inexistente = await api("/citas", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({
      medico_id: 99999,
      especialidad: "Medicina general",
      fecha: "2026-06-16",
      hora: "10:00",
    }),
  });
  assert.equal(inexistente.status, 400);
});

test("POST /citas exige todos los campos", async () => {
  const { status, body } = await api("/citas", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({ especialidad: "Medicina general" }),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test("un paciente NO puede listar las citas de otro (403)", async () => {
  const { status } = await api("/citas/admin@saludya.com", {
    token: tokenPaciente,
  });
  assert.equal(status, 403);
});

test("un admin puede listar las citas de cualquier paciente", async () => {
  const { status, body } = await api("/citas/demo@saludya.com", {
    token: tokenAdmin,
  });

  assert.equal(status, 200);
  assert.equal(body.success, true);
});

test("GET /citas lista todas las citas con nombres de paciente y médico (solo personal)", async () => {
  const comoMedico = await api("/citas", { token: tokenMedico });

  assert.equal(comoMedico.status, 200);
  assert.ok(comoMedico.body.citas.length >= 1);
  assert.equal(comoMedico.body.citas[0].paciente_nombre, "Paciente Actualizado");
  assert.equal(comoMedico.body.citas[0].medico, "Medico Demo");

  const comoPaciente = await api("/citas", { token: tokenPaciente });
  assert.equal(comoPaciente.status, 403);
});

test("un médico solo ve las citas de su propia agenda; el admin las ve todas (RF-12)", async () => {
  // El admin agenda una cita con la otra médica (Paula García).
  const medicos = await api("/medicos", { token: tokenAdmin });
  const paula = medicos.body.medicos.find((m) => m.email === "paula@saludya.com");

  const creacion = await api("/citas", {
    method: "POST",
    token: tokenAdmin,
    body: JSON.stringify({
      paciente_email: "demo@saludya.com",
      medico_id: paula.id,
      especialidad: "Pediatría",
      fecha: "2026-06-20",
      hora: "11:00",
    }),
  });
  assert.equal(creacion.status, 201);

  // Medico Demo no debe ver la cita de Paula.
  const comoMedicoDemo = await api("/citas", { token: tokenMedico });
  assert.ok(comoMedicoDemo.body.citas.every((c) => c.medico === "Medico Demo"));

  // El admin ve las citas de ambos médicos.
  const comoAdmin = await api("/citas", { token: tokenAdmin });
  const nombresMedicos = new Set(comoAdmin.body.citas.map((c) => c.medico));
  assert.ok(nombresMedicos.has("Medico Demo"));
  assert.ok(nombresMedicos.has("Paula García"));
});

test("PATCH /citas/:id/estado permite al médico confirmar una cita", async () => {
  const listado = await api("/citas", { token: tokenMedico });
  const citaId = listado.body.citas[0].id;

  const { status, body } = await api(`/citas/${citaId}/estado`, {
    method: "PATCH",
    token: tokenMedico,
    body: JSON.stringify({ estado: "confirmada" }),
  });

  assert.equal(status, 200);
  assert.equal(body.cita.estado, "confirmada");
});

test("PATCH /citas/:id/estado valida estado y existencia, y rechaza pacientes", async () => {
  const estadoInvalido = await api("/citas/1/estado", {
    method: "PATCH",
    token: tokenMedico,
    body: JSON.stringify({ estado: "inventado" }),
  });
  assert.equal(estadoInvalido.status, 400);

  const inexistente = await api("/citas/99999/estado", {
    method: "PATCH",
    token: tokenMedico,
    body: JSON.stringify({ estado: "confirmada" }),
  });
  assert.equal(inexistente.status, 404);

  const comoPaciente = await api("/citas/1/estado", {
    method: "PATCH",
    token: tokenPaciente,
    body: JSON.stringify({ estado: "confirmada" }),
  });
  assert.equal(comoPaciente.status, 403);
});

test("rutas desconocidas responden 404", async () => {
  const { status } = await api("/no-existe");
  assert.equal(status, 404);
});
