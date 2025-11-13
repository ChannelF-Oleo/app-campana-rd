import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx"; // Librería de Excel
import { FaFileExcel } from "react-icons/fa"; // Icono para el botón
import "./Metrics.css";

// Este componente recibe el usuario actual para saber a quién buscar
function MyRegistrations({ user }) {
  const [registrations, setRegistrations] = useState([]); // Estado para guardar los datos completos
  const [loading, setLoading] = useState(true);

  // Conteo de registros para la visualización
  const count = useMemo(() => registrations.length, [registrations]);

  useEffect(() => {
    if (!user || !user.uid) return;

    const simpatizantesRef = collection(db, "simpatizantes");
    // Consulta: trae solo los registros hechos por el usuario actual
    const q = query(simpatizantesRef, where("registradoPor", "==", user.uid));

    // Escucha de cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegistrations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Función de EXPORTACIÓN A EXCEL
  const handleExport = () => {
    if (registrations.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    // Mapear los datos para crear un formato limpio para el Excel
    const dataToExport = registrations.map((reg) => ({
      Nombre: reg.nombre || "N/A",
      Cedula: reg.cedula || "N/A",
      Telefono: reg.telefono || "N/A",
      Direccion: reg.direccion || "N/A",
      // Convertir el timestamp de Firestore a una cadena de fecha legible
      FechaRegistro: reg.timestamp
        ? new Date(reg.timestamp.toDate()).toLocaleDateString()
        : "N/A",
      // Agrega más campos si son relevantes:
      // Zona: reg.zona || "N/A",
      // Sector: reg.sector || "N/A",
    }));

    // Crear la hoja de cálculo, el libro de trabajo y descargar
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MisRegistros");

    // Construir el nombre del archivo
    const userNameClean = (user.nombre || 'usuario').replace(/\s/g, "_");
    const dateStamp = new Date().toLocaleDateString("es-DO").replace(/\//g, "-");
    const fileName = `Mis_Registros_${userNameClean}_${dateStamp}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);

    alert(`Se han exportado ${registrations.length} registros.`);
  };

  return (
    <div className="metric-card my-registrations-card">
      <div className="metric-card-header">
        <h3>Mis Registros Personales</h3>
        <button
          onClick={handleExport}
          className="export-metric-button"
          disabled={loading || count === 0}
          title="Exportar mis registros a Excel"
        >
          <FaFileExcel />
        </button>
      </div>
      {loading ? (
        <p className="metric-value">...</p>
      ) : (
        <p className="metric-value">{count}</p>
      )}
    </div>
  );
}

export default MyRegistrations;
