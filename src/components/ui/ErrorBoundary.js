import React from "react";

/**
 * Error Boundary global.
 * Captura errores de renderizado en cualquier parte del árbol de componentes
 * y muestra una pantalla de respaldo en lugar de dejar la app en blanco.
 *
 * Nota: los Error Boundaries deben ser componentes de clase. No capturan
 * errores en manejadores de eventos ni en código asíncrono (eso es esperado).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Actualiza el estado para mostrar la UI de respaldo en el próximo render.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Punto único para registrar el error (consola hoy, servicio externo a futuro).
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ marginBottom: "10px" }}>Algo salió mal</h1>
          <p style={{ color: "#666", marginBottom: "20px", maxWidth: "420px" }}>
            Ocurrió un error inesperado. Por favor, vuelve a la página de inicio
            e inténtalo de nuevo.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1976d2",
              color: "#fff",
            }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
