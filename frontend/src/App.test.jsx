import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

test("la app carga y muestra la pantalla de inicio de sesión", () => {
  render(<App />);

  expect(screen.getByText("Bienvenido")).toBeInTheDocument();
  expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
});

test("redirige al login al entrar a una ruta protegida sin sesión", () => {
  window.history.pushState({}, "", "/dashboard-paciente");

  render(<App />);

  expect(screen.getByText("Bienvenido")).toBeInTheDocument();
});

test("el dashboard del médico muestra estadísticas, solicitudes y agenda", () => {
  localStorage.setItem("token", "token-de-prueba");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ nombre: "Medico Demo", email: "medico@saludya.com", rol: "medico" })
  );
  window.history.pushState({}, "", "/dashboard-medico");

  render(<App />);

  expect(
    screen.getByRole("heading", { name: "Panel médico" })
  ).toBeInTheDocument();
  expect(screen.getByText("Citas hoy")).toBeInTheDocument();
  expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
  expect(screen.getByText("Agenda del día")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Gestión de Citas" })
  ).toBeInTheDocument();
});

test("permite entrar a una ruta protegida con sesión iniciada", () => {
  localStorage.setItem("token", "token-de-prueba");
  localStorage.setItem(
    "usuario",
    JSON.stringify({ nombre: "Paciente Demo", email: "demo@saludya.com", rol: "paciente" })
  );
  window.history.pushState({}, "", "/dashboard-paciente");

  render(<App />);

  expect(screen.getByText("Panel del paciente")).toBeInTheDocument();
});
