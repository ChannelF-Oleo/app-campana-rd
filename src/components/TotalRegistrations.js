import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Import 'query' and 'where'
import './Metrics.css';

// Ahora recibe 'filterUserIds' (puede ser null/undefined para admin)
function TotalRegistrations({ filterUserIds }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simpatizantesRef = collection(db, "simpatizantes");
    let q; // Variable para la consulta

    // Si hay filtros, creamos una consulta filtrada
    if (filterUserIds && filterUserIds.length > 0) {
      // Usamos 'in' para buscar registros donde 'registradoPor' esté en la lista
      q = query(simpatizantesRef, where("registradoPor", "in", filterUserIds));
    } else if (filterUserIds === null) { // Indicador explícito para 'solo yo', no usado aquí pero útil
        setLoading(false); // No hay datos que mostrar si el filtro es inválido o vacío inicialmente
        setCount(0);
        return; // Salimos si no hay IDs para filtrar (ej. multiplicador sin registros)
    }
     else {
      // Si no hay filtros (admin), consultamos toda la colección
      q = query(simpatizantesRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
      setLoading(false);
    }, (error) => { // Añadir manejo de errores
      console.error("Error fetching total registrations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterUserIds]); // El efecto depende de los filtros

  return (
    <div className="metric-card">
      {/* Cambiamos el título según si hay filtro o no */}
      <h3>{filterUserIds ? 'Registros (Equipo)' : 'Total Registros (General)'}</h3>
      {loading ? (
        <p className="metric-value">...</p>
      ) : (
        <p className="metric-value">{count}</p>
      )}
    </div>
  );
}

export default TotalRegistrations;