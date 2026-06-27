import React from "react";
import { Link } from "react-router-dom";

// Página 404. Se renderiza dentro de PublicLayout, por lo que hereda
// Navbar y Footer del sitio público.
const NotFound = () => (
  <div className="not-found-page" style={{ textAlign: "center", padding: "60px 20px" }}>
    <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
    <h2 style={{ marginTop: "10px" }}>Página no encontrada</h2>
    <p style={{ color: "#666", marginBottom: "24px" }}>
      La página que buscas no existe o fue movida.
    </p>
    <Link to="/" className="back-button">
      Volver al inicio
    </Link>
  </div>
);

export default NotFound;
