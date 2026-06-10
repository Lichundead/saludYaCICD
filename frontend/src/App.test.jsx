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
