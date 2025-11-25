import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../AuthContext";
import MyTeam from "./MyTeam";
import TotalRegistrations from "./TotalRegistrations";
import RegistrationsByDayChart from "./RegistrationsByDayChart";
import MyGoals from "./MyGoals";
import RegistrationsByZoneChart from "./RegistrationsByZoneChart";
import MyReferralLink from "./MyReferralLink";
import MyRegisteredSimpatizantes from "./MyRegisteredSimpatizantes";
import PadronCoverageChart from "./PadronCoverageChart";
import "./Dashboard.css";

const Dashboard = ({ user }) => {
  // 1. Lógica de Datos (IDs relevantes para seguridad)
  const [relevantUserIds, setRelevantUserIds] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    if (user.rol === "lider de zona") {
      setRelevantUserIds([user.uid, ...(user.multiplicadoresAsignados || [])]);
    } else if (user.rol === "multiplicador") {
      setRelevantUserIds([user.uid]);
    } else if (user.rol === "admin") {
      setRelevantUserIds(undefined); // undefined = ver todo (Admin)
    } else {
      setRelevantUserIds(null); // null = no ver nada (Seguridad)
    }
  }, [user]);

  // 2. Memorización de componentes estáticos
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

  // 3. Métricas Filtradas
  const filteredMetrics = useMemo(
    () => (
      <>
        <div className="metrics-grid">
          <TotalRegistrations filterUserIds={relevantUserIds} />

          {/* CORRECCIÓN: Solo el ADMIN ve la cobertura del Padrón */}
          {user.rol === "admin" && <PadronCoverageChart />}
        </div>

        {/* Gráficos con filtro aplicado */}
        <div
          className="charts-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <RegistrationsByDayChart filterUserIds={relevantUserIds} />
          <RegistrationsByZoneChart filterUserIds={relevantUserIds} />
        </div>
      </>
    ),
    [relevantUserIds, user.rol]
  ); // Agregamos user.rol a dependencias

  if (!user) return <div className="loading-screen">Cargando datos...</div>;

  return (
    <div className="dashboard-container-inner">
      {/* VISTA LÍDER DE ZONA */}
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

      {/* VISTA ADMIN */}
      {user.rol === "admin" && (
        <>
          <div className="dashboard-welcome">
            <h1>Panel de Administrador: {user.nombre}</h1>
          </div>
          {filteredMetrics}
        </>
      )}

      {/* VISTA MULTIPLICADOR */}
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
