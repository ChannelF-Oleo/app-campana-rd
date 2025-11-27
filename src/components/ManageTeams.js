import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel, FaPrint, FaUserTie } from "react-icons/fa";
import "./ManageTeams.css";
import AvatarFoto from "./AvatarFoto";

function ManageTeams() {
  const [leaders, setLeaders] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeaderId, setExpandedLeaderId] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Estado para controlar qué se imprime (null = todo, ID = solo un líder)
  const [printTargetId, setPrintTargetId] = useState(null);

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
        setLeaders(allUsers.filter((user) => user.rol === "lider de zona"));
        setMultipliers(allUsers.filter((user) => user.rol === "multiplicador"));
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

  // --- EXPORTACIÓN EXCEL ---
  const exportAllTeams = () => {
    if (leaders.length === 0) return;
    const data = leaders.map((leader) => {
      const assigned = getAssignedMultipliers(leader);
      return {
        Líder: leader.nombre,
        Cédula: leader.cedula || "N/A",
        "Total Soldados": assigned.length,
        Nombres: assigned.map((m) => m.nombre).join(", "),
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Resumen");
    XLSX.writeFile(wb, "Equipos_Global.xlsx");
  };

  const exportIndividualTeam = (leader) => {
    const assigned = getAssignedMultipliers(leader);
    if (assigned.length === 0) {
      setNotification({ message: `Pelotón vacío.`, type: "error" });
      return;
    }
    const data = assigned.map((m) => ({
      Líder: leader.nombre,
      Soldado: m.nombre,
      Cédula: m.cedula || "N/A",
      Email: m.email,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Pelotón");
    XLSX.writeFile(wb, `Peloton_${leader.nombre}.xlsx`);
  };

  // --- IMPRESIÓN ---
  const handlePrintGlobal = () => {
    setPrintTargetId(null); // Imprimir todo
    setTimeout(() => window.print(), 100);
  };

  const handlePrintIndividual = (leaderId) => {
    setPrintTargetId(leaderId); // Marcar solo este líder para imprimir
    // Abrimos el acordeón automáticamente para que salga el contenido
    setExpandedLeaderId(leaderId);
    setTimeout(() => {
      window.print();
      setPrintTargetId(null); // Resetear después de imprimir
    }, 500);
  };

  if (loading) return <p className="loading-text">Cargando pelotones...</p>;

  return (
    // Añadimos clase condicional para controlar estilos de impresión
    <div
      className={`manage-teams-container glass-panel ${
        printTargetId ? "printing-single" : ""
      }`}
    >
      <div className="manage-teams-header no-print">
        <h2>Gestión de Pelotones</h2>
        <div className="header-actions">
          <button
            onClick={exportAllTeams}
            className="export-teams-button"
            disabled={leaders.length === 0}
          >
            <FaFileExcel /> Exportar Todo
          </button>
          <button onClick={handlePrintGlobal} className="action-btn print-btn">
            <FaPrint /> Imprimir Todo
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
          // Verificar si este líder es el objetivo de impresión (o si no hay objetivo, se muestran todos)
          const isPrintingThis = printTargetId === leader.id;

          return (
            <div
              key={leader.id}
              className={`leader-item ${isExpanded ? "expanded" : ""} ${
                isPrintingThis ? "print-target" : ""
              }`}
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
                  <button
                    onClick={() => exportIndividualTeam(leader)}
                    className="icon-button excel-mini"
                    title="Descargar Excel"
                    disabled={assigned.length === 0}
                  >
                    <FaFileExcel />
                  </button>

                  {/* BOTÓN RESTAURADO: IMPRIMIR UN SOLO PELOTÓN */}
                  <button
                    onClick={() => handlePrintIndividual(leader.id)}
                    className="icon-button print-mini"
                    title="Imprimir este Pelotón"
                    disabled={assigned.length === 0}
                  >
                    <FaPrint />
                  </button>

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
