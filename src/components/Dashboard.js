import React, { useState, useEffect, useMemo } from "react";

import MyTeam from "./MyTeam";
import TotalRegistrations from "./TotalRegistrations";
import RegistrationsByDayChart from "./RegistrationsByDayChart";
import MyGoals from "./MyGoals";
import RegistrationsByZoneChart from "./RegistrationsByZoneChart";
import MyReferralLink from "./MyReferralLink";
import MyRegisteredSimpatizantes from "./MyRegisteredSimpatizantes";
import PadronCoverageChart from "./PadronCoverageChart";
import "./Dashboard.css";
import AvatarFoto from "./AvatarFoto";

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
          {/* REEMPLAZAR EL TÍTULO DE BIENVENIDA */}
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
              allowReport={true} // <--- Activa el botón de WhatsApp
            />
            <div>
              <h1 style={{ margin: 0 }}>
                ¡Bienvenido, {user.nombre.split(" ")[0]}!
              </h1>
              <small style={{ color: "#666" }}>{user.rol}</small>
            </div>
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
          {/* REEMPLAZAR EL TÍTULO DE BIENVENIDA */}
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
              allowReport={true} // <--- Activa el botón de WhatsApp
            />
            <div>
              <h1 style={{ margin: 0 }}>
                ¡Bienvenido, {user.nombre.split(" ")[0]}!
              </h1>
              <small style={{ color: "#666" }}>{user.rol}</small>
            </div>
          </div>
          {filteredMetrics}
        </>
      )}

      {/* VISTA MULTIPLICADOR */}
      {(user.rol === "multiplicador" ||
        !["admin", "lider de zona"].includes(user.rol)) && (
        <>
          {/* REEMPLAZAR EL TÍTULO DE BIENVENIDA */}
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
              allowReport={true} // <--- Activa el botón de WhatsApp
            />
            <div>
              <h1 style={{ margin: 0 }}>
                ¡Bienvenido, {user.nombre.split(" ")[0]}!
              </h1>
              <small style={{ color: "#666" }}>{user.rol}</small>
            </div>
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
