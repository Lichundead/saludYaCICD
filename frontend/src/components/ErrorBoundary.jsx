import { Component } from "react";

/**
 * Captura errores de renderizado de cualquier vista para que un fallo aislado
 * no deje la app en blanco. Muestra una pantalla de recuperación.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en la interfaz:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <h2 className="auth-title">Algo salió mal</h2>
            <p className="auth-subtitle">
              Ocurrió un error inesperado. Recarga la página para continuar.
            </p>
            <button
              className="auth-button"
              onClick={() => window.location.assign("/")}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
