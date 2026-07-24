import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { FaFilePdf, FaFileImage } from "react-icons/fa";
import { ROL_LIDER, ROL_MULTIPLICADOR } from "../../constants";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";

// Campos/columnas para los exports CON FOTO del roster de pelotones.
const CAMPOS_PDF_ROSTER = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Rol", key: "rol" },
  { label: "Líder", key: "lider" },
];
const COLUMNAS_EXCEL_ROSTER = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Rol", key: "rol", width: 16 },
  { header: "Líder", key: "lider", width: 24 },
];

// --- Spinner de carga ---
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", border: "4px solid rgba(0,77,153,0.15)", borderTopColor: "#004d99", borderRadius: "50%", animation: "spinTeams 0.75s linear infinite" }} />
      <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>{message}</p>
      <style>{`@keyframes spinTeams { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ManageTeams() {
  const [leaders, setLeaders] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeaderId, setExpandedLeaderId] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Estado de los exports con foto (PDF padrón / Excel con foto).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  // 1. CARGA DE DATOS EN TIEMPO REAL
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const allUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaders(allUsers.filter((user) => user.rol === ROL_LIDER));
        setMultipliers(allUsers.filter((user) => user.rol === ROL_MULTIPLICADOR));
        setLoading(false);
      },
      (error) => {
        console.error("Error:", error);
        setNotification({ message: "Error de conexión.", type: "error" });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE ASIGNACIÓN ---
  const assignMultiplier = async (leaderId, multiplierId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayUnion(multiplierId),
      });
      await updateDoc(doc(db, "users", multiplierId), {
        liderAsignado: leaderId,
      });
      setNotification({ message: "Soldado asignado.", type: "success" });
    } catch (error) {
      setNotification({ message: "Error al asignar.", type: "error" });
    }
  };

  const unassignMultiplier = async (leaderId, multiplierId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayRemove(multiplierId),
      });
      await updateDoc(doc(db, "users", multiplierId), { liderAsignado: null });
      setNotification({ message: "Soldado desasignado.", type: "success" });
    } catch (error) {
      setNotification({ message: "Error al desasignar.", type: "error" });
    }
  };

  const handleToggleExpand = (leaderId) => {
    setExpandedLeaderId((prevId) => (prevId === leaderId ? null : leaderId));
  };

  // --- HELPERS ---
  const availableMultipliers = multipliers.filter((m) => !m.liderAsignado);
  const getAssignedMultipliers = (leader) => {
    const assignedIds = leader.multiplicadoresAsignados || [];
    return multipliers.filter((multiplier) =>
      assignedIds.includes(multiplier.id)
    );
  };

  // --- EXPORTACIÓN CON FOTO (padrón) ---
  // Roster completo: líderes + multiplicadores, con la foto (resuelta por cédula)
  // y el líder asignado de cada multiplicador.
  const buildRosterExport = () => {
    const leaderNameById = {};
    leaders.forEach((l) => {
      leaderNameById[l.id] = l.nombre;
    });
    const rows = leaders.map((l) => ({
      cedula: l.cedula,
      nombre: l.nombre,
      telefono: l.telefono || "",
      rol: "Líder",
      lider: "—",
    }));
    multipliers.forEach((m) =>
      rows.push({
        cedula: m.cedula,
        nombre: m.nombre,
        telefono: m.telefono || "",
        rol: "Multiplicador",
        lider: m.liderAsignado
          ? leaderNameById[m.liderAsignado] || "—"
          : "Sin asignar",
      })
    );
    return rows;
  };

  const handleExportPDFFoto = async () => {
    const personas = buildRosterExport();
    if (personas.length === 0) {
      setNotification({ message: "No hay usuarios para exportar.", type: "error" });
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: personas.length });
    try {
      await generarPadronPDF(personas, {
        titulo: "Padrón de Pelotones",
        campos: CAMPOS_PDF_ROSTER,
        fileName: "Pelotones_Padron.pdf",
        onProgress: (fase, hechos, total) => setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      setNotification({ message: "Error al generar el PDF.", type: "error" });
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  const handleExportExcelFoto = async () => {
    const personas = buildRosterExport();
    if (personas.length === 0) {
      setNotification({ message: "No hay usuarios para exportar.", type: "error" });
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: personas.length });
    try {
      await generarExcelConFoto(personas, {
        hojaNombre: "Pelotones",
        columnas: COLUMNAS_EXCEL_ROSTER,
        fileName: "Pelotones_Con_Foto.xlsx",
        onProgress: (fase, hechos, total) => setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando Excel:", error);
      setNotification({ message: "Error al generar el Excel.", type: "error" });
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando pelotones..." />;

  return (
    <div className="manage-teams-container glass-panel">
      <div className="manage-teams-header no-print">
        <h2>Gestión de Pelotones</h2>
        <div className="header-actions">
          <button
            onClick={handleExportPDFFoto}
            className="export-teams-button"
            disabled={exportando || leaders.length + multipliers.length === 0}
          >
            <FaFilePdf /> {exportando ? textoProgreso : "PDF con foto"}
          </button>
          <button
            onClick={handleExportExcelFoto}
            className="export-teams-button"
            disabled={exportando || leaders.length + multipliers.length === 0}
          >
            <FaFileImage /> {exportando ? textoProgreso : "Excel con foto"}
          </button>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="leaders-accordion">
        {leaders.length === 0 && (
          <p className="empty-state-global">No hay líderes de zona.</p>
        )}
        {leaders.map((leader) => {
          const assigned = getAssignedMultipliers(leader);
          const isExpanded = expandedLeaderId === leader.id;

          return (
            <div
              key={leader.id}
              className={`leader-item ${isExpanded ? "expanded" : ""}`}
            >
              <div
                className="leader-header no-print"
                onClick={() => handleToggleExpand(leader.id)}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <AvatarFoto
                    cedula={leader.cedula}
                    nombre={leader.nombre}
                    size="50px"
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                      {leader.nombre}
                    </h3>
                    <span className="team-count-badge">
                      {assigned.length} soldados
                    </span>
                  </div>
                </div>

                <div
                  className="actions-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className="expand-icon"
                    onClick={() => handleToggleExpand(leader.id)}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Contenido del Líder */}
              <div className={`leader-content ${isExpanded ? "expanded" : ""}`}>
                {/* Título solo visible al imprimir */}
                <div className="print-header">
                  <h2>Reporte de Pelotón</h2>
                  <div className="print-leader-info">
                    <AvatarFoto
                      cedula={leader.cedula}
                      nombre={leader.nombre}
                      size="60px"
                    />
                    <div>
                      <h3>{leader.nombre}</h3>
                      <p>Líder de Zona • {assigned.length} Soldados</p>
                    </div>
                  </div>
                </div>

                <div className="team-section">
                  <h4 className="section-title">Soldados Asignados</h4>
                  {assigned.length > 0 ? (
                    <ul className="multiplicadores-list">
                      {assigned.map((m) => (
                        <li key={m.id} className="multiplicador-item">
                          <div className="multiplicador-info">
                            <AvatarFoto
                              cedula={m.cedula}
                              nombre={m.nombre}
                              size="40px"
                            />
                            <div className="info-text">
                              <span className="name">{m.nombre}</span>
                              <span className="cedula">
                                {m.cedula || "Sin Cédula"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => unassignMultiplier(leader.id, m.id)}
                            className="assign-button remove no-print"
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Sin asignaciones.</p>
                  )}
                </div>

                <div className="available-section no-print">
                  <h4 className="section-title">Disponible para Asignar</h4>
                  {availableMultipliers.length > 0 ? (
                    <ul className="multiplicadores-list">
                      {availableMultipliers.map((m) => (
                        <li key={m.id} className="multiplicador-item">
                          <div className="multiplicador-info">
                            <AvatarFoto
                              cedula={m.cedula}
                              nombre={m.nombre}
                              size="40px"
                            />
                            <div className="info-text">
                              <span className="name">{m.nombre}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => assignMultiplier(leader.id, m.id)}
                            className="assign-button add"
                          >
                            Asignar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No hay soldados libres.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ManageTeams;
