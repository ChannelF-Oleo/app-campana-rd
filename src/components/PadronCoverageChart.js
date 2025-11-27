import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./Metrics.css"; // Reutilizamos tus estilos

ChartJS.register(ArcElement, Tooltip, Legend);

const PadronCoverageChart = () => {
  // 1. CONFIGURACIÓN: Define aquí tu meta total de electores
  const TOTAL_PADRON_META = 244000; // Ajusta este número al real

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
  const porcentaje = ((totalSimpatizantes / TOTAL_PADRON_META) * 100).toFixed(
    1
  );
  const faltantes = Math.max(0, TOTAL_PADRON_META - totalSimpatizantes);

  const data = {
    labels: ["Cubierto", "Pendiente"],
    datasets: [
      {
        data: [totalSimpatizantes, faltantes],
        backgroundColor: [
          "#28a745", // Verde (Éxito/Cubierto)
          "#e9ecef", // Gris (Fondo/Pendiente)
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: "70%", // Hace que parezca un anillo (Doughnut) más fino
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="metric-card glass-panel" style={{ textAlign: "center" }}>
      <div className="metric-card-header">
        <h3>Cobertura del Padrón</h3>
      </div>

      <div
        style={{
          position: "relative",
          height: "200px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <Doughnut data={data} options={options} />
            {/* Texto central con el porcentaje */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -60%)", // Ajuste visual
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#004d99",
              }}
            >
              {porcentaje}%
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#666" }}>
        <strong>{totalSimpatizantes.toLocaleString()}</strong> de{" "}
        {TOTAL_PADRON_META.toLocaleString()} votantes
      </div>
    </div>
  );
};

export default PadronCoverageChart;
