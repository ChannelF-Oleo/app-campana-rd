import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Metrics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// PALETA EXTENDIDA (30 Colores Distintos)
// Diseñada para que zonas adyacentes tengan alto contraste
const ZONE_COLORS = [
  "#004d99", // 1. Azul Institucional (A1)
  "#FF6384", // 2. Rojo suave (A)
  "#36A2EB", // 3. Azul claro (B)
  "#FFCE56", // 4. Amarillo (C)
  "#4BC0C0", // 5. Turquesa (D)
  "#9966FF", // 6. Violeta (E)
  "#FF9F40", // 7. Naranja (F)
  "#C9CBCF", // 8. Gris (G)
  "#28a745", // 9. Verde Éxito (H)
  "#dc3545", // 10. Rojo Fuerte (I)
  "#6f42c1", // 11. Púrpura (J)
  "#e83e8c", // 12. Rosa (K)
  "#fd7e14", // 13. Naranja Intenso (L)
  "#20c997", // 14. Verde Azulado (M)
  "#17a2b8", // 15. Cian (N)
  "#6610f2", // 16. Índigo (O)
  "#343a40", // 17. Gris Oscuro (P)
  "#023e8a", // 18. Azul Marino (Q)
  "#0077b6", // 19. Azul Océano (R)
  "#0096c7", // 20. Azul Cielo (S)
  "#00b4d8", // 21. Azul Glaciar (T)
  "#48cae4", // 22. Azul Pálido (U)
  "#90e0ef", // 23. Hielo (W)
  "#588157", // 24. Verde Bosque (X)
  "#3a5a40", // 25. Verde Militar (Y)
  "#a3b18a", // 26. Verde Salvia (Z)
  "#dad7cd", // 27. Beige (Ñ)
  "#e63946", // Extra 1
  "#f1faee", // Extra 2
  "#a8dadc", // Extra 3
];

function RegistrationsByZoneChart({ filterUserIds }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simpatizantesRef = collection(db, "simpatizantes");
    let q;

    if (filterUserIds && filterUserIds.length > 0) {
      q = query(simpatizantesRef, where("registradoPor", "in", filterUserIds));
    } else if (filterUserIds === null) {
      setLoading(false);
      return;
    } else {
      q = query(simpatizantesRef);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const countsByZone = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const zona = data.zona || "Por Asignar";
          countsByZone[zona] = (countsByZone[zona] || 0) + 1;
        });

        const labels = Object.keys(countsByZone).sort(); // Orden alfabético (A, A1, B...)
        const data = labels.map((label) => countsByZone[label]);

        // Asignación cíclica de colores
        const backgroundColors = labels.map(
          (_, index) => ZONE_COLORS[index % ZONE_COLORS.length]
        );

        setChartData({
          labels: labels,
          datasets: [
            {
              label: filterUserIds ? "Tu Equipo" : "Total por Zona",
              data: data,
              backgroundColor: backgroundColors,
              borderColor: "#ffffff",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        });
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando gráfica de zonas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterUserIds]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda para limpiar la vista
      },
      title: {
        display: true,
        text: "Distribución por Zona Electoral",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw} inscritos`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="metric-card chart-card" style={{ height: "400px" }}>
      {loading ? (
        <p>Cargando zonas...</p>
      ) : (
        <Bar options={chartOptions} data={chartData} />
      )}
    </div>
  );
}

export default RegistrationsByZoneChart;
