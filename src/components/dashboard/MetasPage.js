import React from "react";
import { useLayoutContext } from "../../LayoutContext";
import MyGoals from "./MyGoals";
import GoalHistory from "./GoalHistory";

// Página dedicada de Metas: meta activa (progreso), botón para crear una nueva,
// y los logros / historial de metas cumplidas.
function MetasPage({ user }) {
  const layout = useLayoutContext();

  return (
    <div className="dashboard-container-inner metas-page">
      <div className="metas-page-header">
        <h2>Mis Metas</h2>
        <button
          className="save-button"
          onClick={() => layout?.handleOpenGoalModal?.()}
        >
          + Crear nueva meta
        </button>
      </div>

      {/* Meta activa y su progreso. */}
      <MyGoals user={user} />

      {/* Logros / historial de metas cumplidas. */}
      <GoalHistory user={user} alwaysShow />
    </div>
  );
}

export default MetasPage;
