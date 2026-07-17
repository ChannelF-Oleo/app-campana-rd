import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel, FaFilePdf, FaFileImage } from "react-icons/fa";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";

// Campos/columnas para los exports con foto de simpatizantes. Usa los campos
// nuevos de ubicación electoral; fallback "N/A" lo aplican los generadores.
const CAMPOS_PDF_SIMP = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Zona", key: "zona" },
  { label: "Sector", key: "sector" },
  { label: "Subsector", key: "subsector" },
  { label: "Recinto", key: "recinto" },
  { label: "Colegio", key: "colegio" },
];

const COLUMNAS_EXCEL_SIMP = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Sector", key: "sector", width: 18 },
  { header: "Subsector", key: "subsector", width: 18 },
  { header: "Recinto", key: "recinto", width: 22 },
  { header: "Colegio", key: "colegio", width: 14 },
  { header: "FechaRegistro", key: "fechaRegistro", width: 16 },
];

function MyRegisteredSimpatizantes({ user }) {
  const [simpatizantes, setSimpatizantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

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
      Zona: simpatizante.zona || "N/A",
      Sector: simpatizante.sector || "N/A",
      Subsector: simpatizante.subsector || "N/A",
      Recinto: simpatizante.recinto || "N/A",
      Colegio: simpatizante.colegioElectoral || "N/A",
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

  // Normaliza los simpatizantes al shape que consumen los generadores:
  // debe incluir `cedula` (para resolver la foto) y las `key` referenciadas.
  // La fecha se pre-formatea porque los generadores solo convierten a texto.
  const buildPersonasExport = () =>
    simpatizantes.map((s) => ({
      cedula: s.cedula,
      nombre: s.nombre,
      telefono: s.telefono,
      zona: s.zona,
      sector: s.sector,
      subsector: s.subsector,
      recinto: s.recinto,
      colegio: s.colegioElectoral,
      fechaRegistro: s.fechaRegistro
        ? s.fechaRegistro.toDate().toLocaleDateString("es-DO")
        : "",
    }));

  const safeNombre = (user.nombre || "usuario").replace(/\s/g, "_");

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantes.length });
    try {
      await generarPadronPDF(buildPersonasExport(), {
        titulo: "Padrón de Simpatizantes",
        campos: CAMPOS_PDF_SIMP,
        fileName: `Mis_Registros_Padron_${safeNombre}.pdf`,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantes.length });
    try {
      await generarExcelConFoto(buildPersonasExport(), {
        hojaNombre: "Mis Registros",
        columnas: COLUMNAS_EXCEL_SIMP,
        fileName: `Mis_Registros_Con_Foto_${safeNombre}.xlsx`,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
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
            disabled={exportando}
          >
            <FaFileExcel /> Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="export-registros-button"
            title="Exportar PDF tipo padrón con foto"
            disabled={exportando}
          >
            <FaFilePdf /> {exportando ? textoProgreso : "PDF con foto (padrón)"}
          </button>
          <button
            onClick={handleExportExcelFoto}
            className="export-registros-button"
            title="Exportar Excel con foto embebida"
            disabled={exportando}
          >
            <FaFileImage /> {exportando ? textoProgreso : "Excel con foto"}
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

