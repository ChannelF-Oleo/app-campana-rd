import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// Historial de metas CUMPLIDAS del usuario (subcolección users/{uid}/metas),
// ordenadas por fecha de cumplimiento (más recientes primero).

const formatFecha = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const describirMeta = (m) =>
  m.tipo === "acumulado"
    ? `${m.amount} registros (acumulada)`
    : `${m.amount} registros (${m.period || "período"})`;

function GoalHistory({ user }) {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const metasRef = collection(db, "users", user.uid, "metas");
    const qCumplidas = query(
      metasRef,
      where("estado", "==", "cumplida"),
      orderBy("completedAt", "desc")
    );

    const unsub = onSnapshot(
      qCumplidas,
      (snap) => {
        setMetas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando el historial de metas:", err);
        setError(
          "No se pudo cargar el historial de metas. Es posible que falte un índice en la base de datos."
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  if (error) {
    return (
      <div className="metric-card">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Mientras carga o si no hay metas cumplidas aún, no ocupamos espacio.
  if (loading || metas.length === 0) return null;

  return (
    <div className="metric-card goal-history-card">
      <h3>Historial de Metas</h3>
      <ul className="goal-history-list">
        {metas.map((m) => (
          <li key={m.id} className="goal-history-item">
            <span className="goal-completed-badge">✓ Meta cumplida</span>
            <div className="goal-history-info">
              <span className="goal-history-amount">{describirMeta(m)}</span>
              <span className="goal-history-date">
                Cumplida el {formatFecha(m.completedAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GoalHistory;
