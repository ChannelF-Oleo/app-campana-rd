import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
} from "firebase/firestore";

// MIGRACIÓN SUAVE: el antiguo user.goal se IGNORA (no se lee ni se borra). Las
// metas ahora viven en la subcolección users/{uid}/metas. Se decidió ignorar el
// valor viejo en vez de migrarlo automáticamente para no escribir datos sin que
// el usuario lo pida; simplemente crea una meta nueva desde el modal.

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(start.setDate(diff));
};

const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

function MyGoals({ user }) {
  const [activeMeta, setActiveMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [progressCount, setProgressCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Meta ACTIVA de la subcolección (regla: como mucho una).
  useEffect(() => {
    if (!user) return;
    const metasRef = collection(db, "users", user.uid, "metas");
    const qActiva = query(metasRef, where("estado", "==", "activa"), limit(1));

    const unsub = onSnapshot(
      qActiva,
      (snap) => {
        if (snap.empty) {
          setActiveMeta(null);
        } else {
          const d = snap.docs[0];
          setActiveMeta({ id: d.id, ...d.data() });
        }
        setMetaLoading(false);
      },
      (err) => {
        console.error("Error al obtener la meta activa:", err);
        setError("No se pudo cargar la meta.");
        setMetaLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 2) Progreso según el tipo de meta.
  //    - periodo: registros del usuario dentro del período vigente.
  //    - acumulado: (total de registros del usuario) - baselineCount.
  const metaId = activeMeta?.id;
  const metaTipo = activeMeta?.tipo;
  const metaPeriod = activeMeta?.period;
  const metaBaseline = activeMeta?.baselineCount;

  useEffect(() => {
    if (!user || !metaId) {
      setProgressCount(0);
      setCountLoading(false);
      return;
    }

    const simpRef = collection(db, "simpatizantes");
    let q;
    if (metaTipo === "periodo") {
      const now = new Date();
      const startDate =
        metaPeriod === "semanal" ? getStartOfWeek(now) : getStartOfMonth(now);
      q = query(
        simpRef,
        where("registradoPor", "==", user.uid),
        where("fechaRegistro", ">=", startDate)
      );
    } else {
      // Acumulado: total histórico del usuario (sin filtro de fecha).
      q = query(simpRef, where("registradoPor", "==", user.uid));
    }

    setCountLoading(true);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (metaTipo === "acumulado") {
          setProgressCount(Math.max(0, snapshot.size - (metaBaseline || 0)));
        } else {
          setProgressCount(snapshot.size);
        }
        setCountLoading(false);
      },
      (err) => {
        console.error("Error al calcular el progreso:", err);
        setError(
          "No se pudo calcular el progreso. Es posible que falte un índice en la base de datos."
        );
        setCountLoading(false);
      }
    );
    return () => unsub();
  }, [user, metaId, metaTipo, metaPeriod, metaBaseline]);

  if (error) {
    return (
      <div className="metric-card">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (metaLoading) {
    return (
      <div className="metric-card goal-card">
        <h3>Mi Meta</h3>
        <p className="metric-value">...</p>
      </div>
    );
  }

  if (!activeMeta) {
    return (
      <div className="metric-card goal-card">
        <h3>Mi Meta</h3>
        <p className="progress-text" style={{ textAlign: "left" }}>
          No tienes una meta activa. Usa “Establecer Meta” en el menú para crear
          una.
        </p>
      </div>
    );
  }

  const amount = activeMeta.amount || 0;
  const progressPercentage =
    amount > 0 ? (progressCount / amount) * 100 : 0;

  const titulo =
    activeMeta.tipo === "acumulado"
      ? "Meta Acumulada"
      : `Meta de Registros (${
          (activeMeta.period || "").charAt(0).toUpperCase() +
          (activeMeta.period || "").slice(1)
        })`;

  return (
    <div className="metric-card goal-card">
      <h3>{titulo}</h3>
      {countLoading ? (
        <p className="metric-value">...</p>
      ) : (
        <div>
          <p className="metric-value">
            {progressCount} / {amount}
          </p>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {Math.round(progressPercentage)}% completado
          </p>
        </div>
      )}
    </div>
  );
}

export default MyGoals;
