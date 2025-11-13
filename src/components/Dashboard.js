import React, { useState, useEffect } from 'react';
// Imports de los componentes del dashboard
import MyTeam from './MyTeam';
import TotalRegistrations from './TotalRegistrations';
import RegistrationsByDayChart from './RegistrationsByDayChart';
import MyGoals from './MyGoals';
import RegistrationsByZoneChart from './RegistrationsByZoneChart';
import MyReferralLink from './MyReferralLink';
// CORRECCIÓN: Importación correcta de MyRegisteredSimpatizantes
import MyRegisteredSimpatizantes from './MyRegisteredSimpatizantes'; 
import './Dashboard.css';

function Dashboard({ user }) {
  // Estado para guardar los IDs relevantes según el rol
  const [relevantUserIds, setRelevantUserIds] = useState(undefined); // undefined = admin (sin filtro)

  useEffect(() => {
    if (!user) return;

    if (user.rol === 'lider de zona') {
      // Incluye al líder + su equipo
      const ids = [user.uid, ...(user.multiplicadoresAsignados || [])];
      setRelevantUserIds(ids);
    } else if (user.rol === 'multiplicador') {
      // Solo el multiplicador
       setRelevantUserIds([user.uid]);
    } else if (user.rol === 'admin') {
      // Admin ve todo
      setRelevantUserIds(undefined);
    } else {
      // Rol desconocido o sin permisos para ver métricas de equipo
      setRelevantUserIds(null); // Usamos null para indicar "nada que mostrar"
    }

  }, [user]); // Se recalcula si el usuario cambia

  // Si aún estamos determinando los IDs (y no es admin), mostramos carga
  if (relevantUserIds === undefined && user.rol !== 'admin') {
      return <div>Calculando permisos de visualización...</div>;
  }

  // --- CORRECCIÓN: Definir los bloques DENTRO de la función principal ---
  // Bloque de métricas generales/filtradas
  const filteredMetrics = (
    <>
      <div className="dashboard-section-title">
        {user.rol === 'admin' ? 'Métricas Generales' : 'Métricas Equipo / Personales'}
      </div>
      <div className="metrics-grid">
        <TotalRegistrations filterUserIds={relevantUserIds} />
        <RegistrationsByDayChart filterUserIds={relevantUserIds} />
        <RegistrationsByZoneChart filterUserIds={relevantUserIds} />
      </div>
    </>
  );

  // Bloque de meta personal (solo para roles con metas)
  const personalGoal = (user.rol === 'multiplicador' || user.rol === 'lider de zona') ? (
    <>
      <div className="dashboard-section-title">Mi Meta Actual</div>
      <div className="metrics-grid">
        <MyGoals user={user} />
      </div>
    </>
  ) : null; // No mostrar nada si es admin

  // Bloque del enlace de referido (solo para roles con referido)
  const referralLinkSection = (user.rol === 'multiplicador' || user.rol === 'lider de zona') 
    ? <MyReferralLink user={user} /> 
    : null;

  // Bloque de la lista de registros personales
   const myRegistrationsList = (user.rol === 'multiplicador' || user.rol === 'lider de zona') ? (
    <>
      <div className="dashboard-section-title">Mis Soldados Registrados</div>
      <MyRegisteredSimpatizantes user={user} />
    </>
   ) : null;


  // --- Función interna para renderizar el contenido según el rol ---
  // (No es estrictamente necesaria, pero ayuda a organizar)
  const renderRoleSpecificContent = () => {
    switch (user.rol) {
      case 'lider de zona':
        return (
          <>
          <div className="dashboard-welcome"><h1>¡Bienvenido, {user.nombre}!</h1></div>
            {referralLinkSection}
            {personalGoal}
            {myRegistrationsList} {/* Lista personal del líder */}
            {filteredMetrics} {/* Métricas del equipo del líder */}
            <div className="dashboard-section-title">Mi Peloton Asignado</div>
            <MyTeam user={user} />
          </>
        );
      case 'admin':
        return (
          <>
            <div className="dashboard-welcome"><h1>Panel de Administrador,
          ¡Bienvenido, {user.nombre}!</h1></div>
            {filteredMetrics} {/* Admin ve métricas generales */}
          </>
        );
      case 'multiplicador':
      default: // Multiplicador
        return (
          <>
            <div className="dashboard-welcome"><h1>¡Bienvenido, {user.nombre}!</h1></div>
            {referralLinkSection}
            {personalGoal}
            {myRegistrationsList} {/* Lista personal del multiplicador */}
            {filteredMetrics} {/* Métricas filtradas solo para él */}
          </>
        );
    }
  };

  // --- Renderizado principal del componente Dashboard ---
  return (
    <div>
      {/* Llamamos a la función que decide qué mostrar */}
      {renderRoleSpecificContent()}
    </div>
  ); 
  // CORRECCIÓN: No debe haber código después de este return que cause 'Unreachable code'
}

export default Dashboard;
