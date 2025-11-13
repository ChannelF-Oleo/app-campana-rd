import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js'; // Added Title
import './Metrics.css';

ChartJS.register(ArcElement, Tooltip, Legend, Title); // Register Title

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
        setChartData({ labels: [], datasets: [] });
        return;
    } else {
      q = query(simpatizantesRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const countsByZone = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const zone = data.sector || 'No especificado';
        countsByZone[zone] = (countsByZone[zone] || 0) + 1;
      });

      const labels = Object.keys(countsByZone);
      const data = Object.values(countsByZone);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Simpatizantes',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)', // Added more colors
              'rgba(83, 102, 255, 0.7)',
              'rgba(100, 255, 100, 0.7)',
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      });
      setLoading(false);
    }, (error) => {
        console.error("Error fetching zone chart data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [filterUserIds]);

  // Define chartOptions completely here
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows setting height
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        // Set dynamic title directly
        text: filterUserIds ? 'Distribución por Zona (Equipo)' : 'Distribución por Zona (General)',
      },
    },
  };

  return (
    // Added a container div to control chart height
    <div className="metric-card chart-card" style={{ height: '400px' }}>
      {loading ? <p>Generando gráfico...</p> : <Pie options={chartOptions} data={chartData} />}
    </div>
  );
}

export default RegistrationsByZoneChart;