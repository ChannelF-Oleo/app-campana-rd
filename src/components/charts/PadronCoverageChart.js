import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { TOTAL_PADRON_META } from "../../constants";

// Barra de avance del total de simpatizantes contra una meta. Por defecto es la
// cobertura del padrón; con props se reutiliza para otras metas (p.ej. la meta de
// inscritos). Varias instancias comparten el mismo listener de Firestore (el SDK
// unifica consultas idénticas), así que no multiplican las lecturas.
const PadronCoverageChart = ({
  titulo = "Cobertura del Padrón",
  meta = TOTAL_PADRON_META, // .env (REACT_APP_PADRON_META) vía constants.js
  unidad = "votantes",
}) => {

  const [totalSimpatizantes, setTotalSimpatizantes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchamos la colección completa para tener el número en tiempo real
    // Nota: Para optimizar costos en producción con miles de usuarios,
    // podríamos cambiar esto por una Cloud Function que actualice un contador.
    const unsub = onSnapshot(collection(db, "simpatizantes"), (snap) => {
      setTotalSimpatizantes(snap.size);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Cálculos
  const porcentaje = ((totalSimpatizantes / meta) * 100).toFixed(1);

  return (
    <div className="metric-card glass-panel padron-coverage-card">
      <div className="metric-card-header">
        <h3>{titulo}</h3>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="padron-coverage-row">
            <span className="padron-coverage-pct">{porcentaje}%</span>
            <span className="padron-coverage-count">
              <strong>{totalSimpatizantes.toLocaleString()}</strong> de{" "}
              {meta.toLocaleString()} {unidad}
            </span>
          </div>

          {/* Barra de progreso CSS (más liviana que chart.js para esto). La
              porción verde ("Cubierto") usa min-width para seguir siendo visible
              aunque el % sea mínimo (ej. 0.1%). */}
          <div
            className="padron-progress-track"
            role="progressbar"
            aria-label={titulo}
            aria-valuenow={Number(porcentaje)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="padron-progress-fill"
              style={{ width: `max(4px, ${Math.min(Number(porcentaje), 100)}%)` }}
            />
          </div>

          <div className="padron-coverage-legend">
            <span>
              <span className="legend-dot legend-dot--cubierto" />
              Cubierto
            </span>
            <span>
              <span className="legend-dot legend-dot--pendiente" />
              Pendiente
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default PadronCoverageChart;
