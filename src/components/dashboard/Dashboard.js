import React, { useState, useEffect, useMemo } from "react";

import MyTeam from "./MyTeam";
import TotalRegistrations from "./TotalRegistrations";
import RegistrationsByDayChart from "../charts/RegistrationsByDayChart";
import MyGoals from "./MyGoals";
import GoalHistory from "./GoalHistory";
import RankingMultiplicadores from "./RankingMultiplicadores";
import RegistrationsByZoneChart from "../charts/RegistrationsByZoneChart";
import RegistrationsBySectorChart from "../charts/RegistrationsBySectorChart";
import RegistrationsBySubsectorChart from "../charts/RegistrationsBySubsectorChart";
import MyReferralLink from "./MyReferralLink";
import MyRegisteredSimpatizantes from "./MyRegisteredSimpatizantes";
import PadronCoverageChart from "../charts/PadronCoverageChart";
import DashboardWelcome from "./DashboardWelcome";
import Loader from "../ui/Loader";
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from "../../constants";

const Dashboard = ({ user }) => {
  // 1. Lógica de Datos (IDs relevantes para seguridad)
  const [relevantUserIds, setRelevantUserIds] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    if (user.rol === ROL_LIDER) {
      setRelevantUserIds([user.uid, ...(user.multiplicadoresAsignados || [])]);
    } else if (user.rol === ROL_MULTIPLICADOR) {
      setRelevantUserIds([user.uid]);
    } else if (user.rol === ROL_ADMIN) {
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
  const goalHistory = useMemo(
    () => <GoalHistory key="goal-history" user={user} />,
    [user]
  );
  const ranking = useMemo(
    () => <RankingMultiplicadores key="ranking" user={user} />,
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
          {user.rol === ROL_ADMIN && <PadronCoverageChart />}
        </div>

        {/* Gráficos con filtro aplicado */}
        <div
          className="charts-grid"
          style={{
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <RegistrationsByDayChart filterUserIds={relevantUserIds} />
          <RegistrationsByZoneChart filterUserIds={relevantUserIds} />
          {/* NOTA: hoy solo ZONA N tiene sector/subsector poblado, así que estos
              dos gráficos mostrarán la mayoría en "Por Asignar" hasta que haya
              registros de Hato Nuevo. Es correcto, no un bug. */}
          <RegistrationsBySectorChart filterUserIds={relevantUserIds} />
          <RegistrationsBySubsectorChart filterUserIds={relevantUserIds} />
        </div>
      </>
    ),
    [relevantUserIds, user.rol]
  ); // Agregamos user.rol a dependencias

  if (!user) return <Loader message="Cargando datos..." />;

  return (
    <div className="dashboard-container-inner">
      {/* VISTA LÍDER DE ZONA */}
      {user.rol === ROL_LIDER && (
        <>
          <DashboardWelcome user={user} />
          {referralLinkSection}
          {personalGoal}
          {goalHistory}
          {myRegistrationsList}
          <div className="dashboard-section-title">Métricas de mi Equipo</div>
          {filteredMetrics}
          <div className="dashboard-section-title">Ranking de mi Equipo</div>
          {ranking}
          <div className="dashboard-section-title">Mi Pelotón Asignado</div>
          <MyTeam user={user} />
        </>
      )}

      {/* VISTA ADMIN */}
      {user.rol === ROL_ADMIN && (
        <>
          <DashboardWelcome user={user} />
          {filteredMetrics}
          <div className="dashboard-section-title">
            Ranking de Multiplicadores
          </div>
          {ranking}
        </>
      )}

      {/* VISTA MULTIPLICADOR */}
      {(user.rol === ROL_MULTIPLICADOR ||
        ![ROL_ADMIN, ROL_LIDER].includes(user.rol)) && (
        <>
          <DashboardWelcome user={user} />
          {referralLinkSection}
          {personalGoal}
          {goalHistory}
          {myRegistrationsList}
          <div className="dashboard-section-title">Métricas Personales</div>
          {filteredMetrics}
        </>
      )}
    </div>
  );
};

export default Dashboard;
