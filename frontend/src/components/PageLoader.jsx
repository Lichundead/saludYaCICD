/**
 * Indicador de carga mostrado mientras se descarga el código de una vista
 * (carga diferida por ruta).
 */
function PageLoader() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p className="auth-subtitle" style={{ margin: 0 }}>
          Cargando…
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
