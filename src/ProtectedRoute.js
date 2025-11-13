import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Componente de Ruta Protegida.
 * Redirige al usuario a la página de login si no está autenticado.
 * * @param {object} props
 * @param {boolean} props.isAuthenticated - Estado de autenticación del usuario.
 * @param {React.ReactNode} props.children - Componente a renderizar si está autenticado.
 */
const ProtectedRoute = ({ isAuthenticated, children }) => {
  // Si el usuario no está autenticado, lo redirige al login
  if (!isAuthenticated) {
    // Usamos replace para evitar que el usuario vuelva a la página protegida con el botón de atrás
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderiza el componente hijo (ej. <Dashboard />)
  return children;
};

export default ProtectedRoute;
