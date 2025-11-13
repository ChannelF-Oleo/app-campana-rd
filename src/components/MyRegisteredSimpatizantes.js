import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";
import "./MyRegisteredSimpatizantes.css";

// Importar el mapa de zonas para traducir si es necesario (opcional)
// import { MAPA_CENTROS_POR_ZONA } from './ZonasElectorales';

function MyRegisteredSimpatizantes({ user }) {
  const [simpatizantes, setSimpatizantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const simpatizantesRef = collection(db, "simpatizantes");
    const q = query(
      simpatizantesRef,
      where("registradoPor", "==", user.uid),
      orderBy("fechaRegistro", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const registeredList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSimpatizantes(registeredList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching registered simpatizantes:", err);
        setError(
          "Error al cargar tus registros. Verifica la consola o contacta al administrador."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- FUNCIÓN DE EXPORTACIÓN A EXCEL ---
  const handleExport = () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }

    const dataToExport = simpatizantes.map((simpatizante) => ({
      Nombre: simpatizante.nombre || "N/A",
      Cédula: simpatizante.cedula || "N/A",
      Teléfono: simpatizante.telefono || "N/A",
      Dirección: simpatizante.direccion || "N/A",
      Zona: simpatizante.zona || "N/A",
      Sector: simpatizante.sector || "N/A",
      FechaRegistro: simpatizante.fechaRegistro
        ? simpatizante.fechaRegistro.toDate().toLocaleDateString("es-DO")
        : "N/A",
      Registrador: user.nombre || "Yo mismo",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mis Registros");

    const fileName = `Mis_Registros_Personales_${user.nombre.replace(
      /\s/g,
      "_"
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  // ------------------------------------

  if (loading) {
    return <p>Cargando tus registros...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="my-registrations-container">
      {/* Barra de Acciones y Botón de Exportar */}
      <div className="registration-actions-bar">
        {simpatizantes.length > 0 && (
          <button
            onClick={handleExport}
            className="export-registros-button"
            title="Exportar mis registros a Excel"
          >
            <FaFileExcel /> Exportar ({simpatizantes.length})
          </button>
        )}
      </div>

      {simpatizantes.length > 0 ? (
        <div className="table-wrapper">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Sector</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {simpatizantes.map((simpatizante) => (
                <tr key={simpatizante.id}>
                  <td>{simpatizante.nombre}</td>
                  <td>{simpatizante.sector}</td>
                  <td>
                    {simpatizante.fechaRegistro
                      ?.toDate()
                      .toLocaleDateString("es-DO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">
          Aún no has registrado ningún simpatizante.
        </p>
      )}
    </div>
  );
}

export default MyRegisteredSimpatizantes;
