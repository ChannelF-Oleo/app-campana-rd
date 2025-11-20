import React, { useState, useEffect, useMemo } from "react";
// NOTA: No importamos DashboardSidebar ni Navbar aquí. Eso lo maneja App.js

// Componentes de Widgets
import MyTeam from "./MyTeam";
import TotalRegistrations from "./TotalRegistrations";
import RegistrationsByDayChart from "./RegistrationsByDayChart";
import MyGoals from "./MyGoals";
import RegistrationsByZoneChart from "./RegistrationsByZoneChart";
import MyReferralLink from "./MyReferralLink";
import MyRegisteredSimpatizantes from "./MyRegisteredSimpatizantes";
import "./Dashboard.css";

const Dashboard = ({ user }) => {
  const [relevantUserIds, setRelevantUserIds] = useState(undefined);

  // 1. Lógica para determinar qué datos ver según el rol
  useEffect(() => {
    if (!user) return;
    if (user.rol === "lider de zona") {
      setRelevantUserIds([user.uid, ...(user.multiplicadoresAsignados || [])]);
    } else if (user.rol === "multiplicador") {
      setRelevantUserIds([user.uid]);
    } else if (user.rol === "admin") {
      setRelevantUserIds(undefined); // undefined = ver todo
    } else {
      setRelevantUserIds(null); // null = no ver nada
    }
  }, [user]);

  // 2. Memorizar componentes costosos para evitar re-renders
  const referralLinkSection = useMemo(
    () => <MyReferralLink key="link" user={user} />,
    [user]
  );
  const personalGoal = useMemo(
    () => <MyGoals key="goals" user={user} />,
    [user]
  );
  const myRegistrationsList = useMemo(
    () => <MyRegisteredSimpatizantes key="reg-list" user={user} />,
    [user]
  );

  const filteredMetrics = useMemo(
    () => (
      <>
        <div className="metrics-grid">
          <TotalRegistrations userIds={relevantUserIds} />
        </div>
        <RegistrationsByDayChart userIds={relevantUserIds} />
        <RegistrationsByZoneChart userIds={relevantUserIds} />
      </>
    ),
    [relevantUserIds]
  );

  if (!user) return <div className="loading-screen">Cargando datos...</div>;

  // 3. Renderizado limpio (sin layout wrappers)
  return (
    <div className="dashboard-container-inner">
      {/* --- ROL: LÍDER DE ZONA --- */}
      {user.rol === "lider de zona" && (
        <>
          <div className="dashboard-welcome">
            <h1>¡Bienvenido, {user.nombre}!</h1>
          </div>
          {referralLinkSection}
          {personalGoal}
          {myRegistrationsList}

          <div className="dashboard-section-title">Métricas de mi Equipo</div>
          {filteredMetrics}

          <div className="dashboard-section-title">Mi Pelotón Asignado</div>
          <MyTeam user={user} />
        </>
      )}

      {/* --- ROL: ADMIN --- */}
      {user.rol === "admin" && (
        <>
          <div className="dashboard-welcome">
            <h1>Panel de Administrador: {user.nombre}</h1>
          </div>
          {filteredMetrics}
        </>
      )}

      {/* --- ROL: MULTIPLICADOR (y otros) --- */}
      {(user.rol === "multiplicador" ||
        !["admin", "lider de zona"].includes(user.rol)) && (
        <>
          <div className="dashboard-welcome">
            <h1>¡Bienvenido, {user.nombre}!</h1>
          </div>
          {referralLinkSection}
          {personalGoal}
          {myRegistrationsList}

          <div className="dashboard-section-title">Métricas Personales</div>
          {filteredMetrics}
        </>
      )}
    </div>
  );
};

export default Dashboard;
