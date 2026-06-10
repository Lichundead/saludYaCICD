/**
 * @file api.test.js
 * @description Pruebas de integración de la API de SaludYa usando `node:test`
 * y el `fetch` nativo de Node contra una base de datos SQLite en memoria.
 */

process.env.DB_PATH = ":memory:";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

let server;
let baseUrl;
let tokenPaciente;
let tokenAdmin;

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
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  tokenPaciente = (await login("demo@saludya.com", "123456")).body.token;
  tokenAdmin = (await login("admin@saludya.com", "123456")).body.token;
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

test("POST /citas exige token (401 sin autenticación)", async () => {
  const { status } = await api("/citas", {
    method: "POST",
    body: JSON.stringify({
      especialidad: "Medicina general",
      medico: "Paula García",
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
      especialidad: "Medicina general",
      medico: "Paula García",
      fecha: "2026-06-15",
      hora: "09:30",
    }),
  });

  assert.equal(creacion.status, 201);

  const listado = await api("/citas/demo@saludya.com", { token: tokenPaciente });

  assert.equal(listado.status, 200);
  assert.equal(listado.body.citas.length, 1);
  assert.equal(listado.body.citas[0].paciente_email, "demo@saludya.com");
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

test("POST /citas exige todos los campos", async () => {
  const { status, body } = await api("/citas", {
    method: "POST",
    token: tokenPaciente,
    body: JSON.stringify({ especialidad: "Medicina general" }),
  });

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test("rutas desconocidas responden 404", async () => {
  const { status } = await api("/no-existe");
  assert.equal(status, 404);
});
