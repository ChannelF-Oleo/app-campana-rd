import React from "react";

// Indicador de carga unificado.
// Reemplaza los <div className="loading-screen">...</div> dispersos por la app.
// Acepta un mensaje opcional (por defecto "Cargando...").
const Loader = ({ message = "Cargando..." }) => (
  <div className="loading-screen" role="status" aria-live="polite">
    {message}
  </div>
);

export default Loader;
