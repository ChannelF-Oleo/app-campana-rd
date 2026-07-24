import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { TOTAL_PADRON_META } from "../../constants";

const PadronCoverageChart = () => {
  // TOTAL_PADRON_META se lee desde .env (REACT_APP_PADRON_META) vía constants.js

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
  const porcentaje = ((totalSimpatizantes / TOTAL_PADRON_META) * 100).toFixed(1);

  return (
    <div className="metric-card glass-panel padron-coverage-card">
      <div className="metric-card-header">
        <h3>Cobertura del Padrón</h3>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="padron-coverage-row">
            <span className="padron-coverage-pct">{porcentaje}%</span>
            <span className="padron-coverage-count">
              <strong>{totalSimpatizantes.toLocaleString()}</strong> de{" "}
              {TOTAL_PADRON_META.toLocaleString()} votantes
            </span>
          </div>

          {/* Barra de progreso CSS (más liviana que chart.js para esto). La
              porción verde ("Cubierto") usa min-width para seguir siendo visible
              aunque el % sea mínimo (ej. 0.1%). */}
          <div
            className="padron-progress-track"
            role="progressbar"
            aria-valuenow={Number(porcentaje)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="padron-progress-fill"
              style={{ width: `max(4px, ${porcentaje}%)` }}
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
