import React from "react";
import AvatarFoto from "../ui/AvatarFoto";

// Encabezado de bienvenida del dashboard (avatar + saludo + rol).
// Reutilizado por las vistas de líder de zona, admin y multiplicador.
const DashboardWelcome = ({ user }) => (
  <div
    className="dashboard-welcome-row"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "20px",
    }}
  >
    <AvatarFoto
      cedula={user.cedula}
      nombre={user.nombre}
      size="60px"
      allowReport={true} // Activa el botón de WhatsApp
    />
    <div>
      <h1 style={{ margin: 0 }}>¡Bienvenido, {user.nombre.split(" ")[0]}!</h1>
      <small style={{ color: "#666" }}>{user.rol}</small>
    </div>
  </div>
);

export default DashboardWelcome;
