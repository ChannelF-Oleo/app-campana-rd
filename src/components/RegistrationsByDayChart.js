import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Metrics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function RegistrationsByDayChart({ filterUserIds }) {
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
      const countsByDay = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.fechaRegistro && data.fechaRegistro.toDate) { // Check if it's a Firestore Timestamp
            const date = data.fechaRegistro.toDate();
            const day = date.toLocaleDateString('es-DO', {day: '2-digit', month: '2-digit', year: 'numeric'}); // Format DD/MM/YYYY
            countsByDay[day] = (countsByDay[day] || 0) + 1;
        }
      });

      // Sort labels chronologically (DD/MM/YYYY)
      const labels = Object.keys(countsByDay).sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/');
          const [dayB, monthB, yearB] = b.split('/');
          return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
      });
      const data = labels.map(label => countsByDay[label]);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: filterUserIds ? 'Registros por Día (Equipo)' : 'Registros por Día (General)',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue color
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      });
      setLoading(false);
    }, (error) => {
        console.error("Error fetching daily chart data:", error);
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
        text: filterUserIds ? 'Evolución Diaria (Equipo)' : 'Evolución Diaria (General)',
      },
    },
    scales: { // Optional: ensure Y-axis starts at 0
        y: {
            beginAtZero: true
        }
    }
  };

  return (
    // Added a container div to control chart height
    <div className="metric-card chart-card" style={{ height: '400px' }}>
      {loading ? <p>Generando gráfico...</p> : <Bar options={chartOptions} data={chartData} />}
    </div>
  );
}

export default RegistrationsByDayChart;