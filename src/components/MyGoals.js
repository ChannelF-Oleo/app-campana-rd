import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './Metrics.css';

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
  const [myRegistrations, setMyRegistrations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para guardar errores

  const goal = user.goal || { amount: 50, period: 'mensual' }; 

  useEffect(() => {
    if (!user) return;
    
    const now = new Date();
    const startDate = goal.period === 'semanal' ? getStartOfWeek(now) : getStartOfMonth(now);
    
    const q = query(
      collection(db, "simpatizantes"), 
      where("registradoPor", "==", user.uid),
      where("fechaRegistro", ">=", startDate)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // Callback de éxito
        setMyRegistrations(snapshot.size);
        setLoading(false);
      }, 
      (err) => {
        // Callback de error
        console.error("Error al obtener metas:", err);
        setError("No se pudieron cargar las metas. Es posible que falte un índice en la base de datos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, goal.period]);

  const progressPercentage = goal.amount > 0 ? (myRegistrations / goal.amount) * 100 : 0;

  if (error) {
    return <div className="metric-card"><p style={{ color: 'red' }}>{error}</p></div>
  }

  return (
    <div className="metric-card goal-card">
      <h3>Meta de Registros ({goal.period.charAt(0).toUpperCase() + goal.period.slice(1)})</h3>
      {loading ? (
        <p className="metric-value">...</p>
      ) : (
        <div>
          <p className="metric-value">{myRegistrations} / {goal.amount}</p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="progress-text">{Math.round(progressPercentage)}% completado</p>
        </div>
      )}
    </div>
  );
}

export default MyGoals;