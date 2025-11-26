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
import AvatarFoto from "./AvatarFoto"; // <--- IMPORTAR COMPONENTE

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
    <div className="my-registrations-container glass-panel">
      {/* Barra de Acciones y Botón de Exportar */}
      {simpatizantes.length > 0 && (
        <div className="registration-actions-bar">
          <p className="registration-count">
             Total Registrados: <strong>{simpatizantes.length}</strong>
          </p>
          <button
            onClick={handleExport}
            className="export-registros-button"
            title="Exportar mis registros a Excel"
          >
            <FaFileExcel /> Exportar Excel
          </button>
        </div>
      )}

      {simpatizantes.length > 0 ? (
        <div className="table-wrapper">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Foto</th> {/* Nueva Columna */}
                <th>Nombre</th>
                <th>Sector</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {simpatizantes.map((simpatizante) => (
                <tr key={simpatizante.id}>
                  {/* Célula de Foto */}
                  <td style={{ width: '60px' }}>
                    <AvatarFoto 
                        cedula={simpatizante.cedula} 
                        nombre={simpatizante.nombre} 
                        size="40px" 
                        allowReport={true}
                    />
                  </td>

                  <td>
                    <div style={{fontWeight: '600'}}>{simpatizante.nombre}</div>
                    {simpatizante.cedula ? (
                        <small style={{color: '#666'}}>{simpatizante.cedula}</small>
                    ) : (
                        <small style={{color: '#e63946'}}>Sin Cédula</small>
                    )}
                  </td>

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
        <div className="empty-state">
          <p>Aún no has registrado ningún simpatizante.</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>¡Empieza hoy mismo usando el formulario de registro!</p>
        </div>
      )}
    </div>
  );
}

export default MyRegisteredSimpatizantes;

