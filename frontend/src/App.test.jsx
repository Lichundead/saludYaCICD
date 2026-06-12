import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

test("la app carga y muestra la pantalla de inicio de sesión", async () => {
  render(<App />);

  expect(await screen.findByText("Bienvenido")).toBeInTheDocument();
  expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
});

test("redirige al login al entrar a una ruta protegida sin sesión", async () => {
  window.history.pushState({}, "", "/dashboard-paciente");

  render(<App />);

  expect(await screen.findByText("Bienvenido")).toBeInTheDocument();
});

test("el dashboard del médico muestra estadísticas, solicitudes y agenda", async () => {
  localStorage.setItem("token", "token-de-prueba");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ nombre: "Medico Demo", email: "medico@saludya.com", rol: "medico" })
  );
  window.history.pushState({}, "", "/dashboard-medico");

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "Panel médico" })
  ).toBeInTheDocument();
  expect(screen.getByText("Citas hoy")).toBeInTheDocument();
  expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
  expect(screen.getByText("Agenda del día")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Gestión de Citas" })
  ).toBeInTheDocument();
});

test("el perfil del paciente usa el panel y muestra sus datos", async () => {
  localStorage.setItem("token", "token-de-prueba");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ nombre: "Paciente Demo", email: "demo@saludya.com", rol: "paciente" })
  );
  window.history.pushState({}, "", "/perfil");

  render(<App />);

  expect(await screen.findByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
  expect(screen.getByText("Datos personales")).toBeInTheDocument();
  expect(screen.getByDisplayValue("demo@saludya.com")).toBeInTheDocument();
  // El enlace para cambiar contraseña integra el perfil con ese flujo.
  expect(
    screen.getByRole("button", { name: /Cambiar contraseña/i })
  ).toBeInTheDocument();
});

test("permite entrar a una ruta protegida con sesión iniciada", async () => {
  localStorage.setItem("token", "token-de-prueba");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ nombre: "Paciente Demo", email: "demo@saludya.com", rol: "paciente" })
  );
  window.history.pushState({}, "", "/dashboard-paciente");

  render(<App />);

  expect(await screen.findByText("Panel del paciente")).toBeInTheDocument();
});
