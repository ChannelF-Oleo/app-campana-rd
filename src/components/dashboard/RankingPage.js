import React from "react";
import RankingMultiplicadores from "./RankingMultiplicadores";

// Página propia del ranking de multiplicadores. RankingMultiplicadores ya
// resuelve el alcance por rol (admin: global; líder: su equipo) y devuelve null
// para quien no debe verlo.
function RankingPage({ user }) {
  return (
    <div className="dashboard-container-inner">
      <RankingMultiplicadores user={user} />
    </div>
  );
}

export default RankingPage;
