import React, { useState, useEffect } from "react";
import { db } from "../firebase";
// 1. Importamos getCountFromServer
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import "./Metrics.css";

function TotalRegistrations({ filterUserIds }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función asíncrona para pedir el conteo
    const fetchCount = async () => {
      setLoading(true);
      try {
        const simpatizantesRef = collection(db, "simpatizantes");
        let q;

        if (filterUserIds && filterUserIds.length > 0) {
          // Nota: Firestore limita el operador 'in' a un máximo de 10-30 valores.
          // Si un líder tiene más de 30 multiplicadores, esto podría requerir otra estrategia.
          q = query(
            simpatizantesRef,
            where("registradoPor", "in", filterUserIds)
          );
        } else if (filterUserIds === null) {
          setCount(0);
          setLoading(false);
          return;
        } else {
          // Admin: Cuenta toda la colección sin descargar los documentos
          q = query(simpatizantesRef);
        }

        // 2. Usamos la función optimizada
        const snapshot = await getCountFromServer(q);
        setCount(snapshot.data().count);
      } catch (error) {
        console.error("Error obteniendo conteo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Nota: Ya no hay 'unsubscribe' porque no es una conexión en vivo
  }, [filterUserIds]);

  return (
    <div className="metric-card">
      <h3>
        {filterUserIds ? "Registros (Equipo)" : "Total Registros (General)"}
      </h3>
      {loading ? (
        <p className="metric-value">Calculando...</p>
      ) : (
        <p className="metric-value">{count}</p>
      )}
    </div>
  );
}

export default TotalRegistrations;
