import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import "./ManageTeams.css";
import AvatarFoto from "./AvatarFoto";

function ManageTeams() {
  const [leaders, setLeaders] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        setLeaders(users.filter((u) => u.rol === "lider de zona"));
        setMultipliers(users.filter((u) => u.rol === "multiplicador"));
      } catch (err) {
        setNotification({ message: "Error cargando usuarios", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getAssigned = (leader) => {
    const ids = leader.multiplicadoresAsignados || [];
    return multipliers.filter((m) => ids.includes(m.id));
  };

  const available = multipliers.filter((m) => !m.liderAsignado);

  const assign = async (leaderId, mId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayUnion(mId),
      });

      await updateDoc(doc(db, "users", mId), {
        liderAsignado: leaderId,
      });

      setNotification({ message: "Soldado asignado", type: "success" });
    } catch {
      setNotification({ message: "Error asignando", type: "error" });
    }
  };

  const unassign = async (leaderId, mId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayRemove(mId),
      });

      await updateDoc(doc(db, "users", mId), {
        liderAsignado: null,
      });

      setNotification({ message: "Soldado quitado", type: "success" });
    } catch {
      setNotification({ message: "Error quitando", type: "error" });
    }
  };

  /** -----------------------------------------------------------------------------
   *                  IMPRESIÓN GLOBAL
   ------------------------------------------------------------------------------*/
  const handlePrintGlobal = () => {
    const html = document.getElementById("print-area-global").innerHTML;
    const original = document.body.innerHTML;

    document.body.innerHTML = html;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  /** -----------------------------------------------------------------------------
   *                  IMPRESIÓN INDIVIDUAL POR LÍDER
   ------------------------------------------------------------------------------*/
  const handlePrintTeam = (leader) => {
    const container = document.getElementById("print-area-single");
    const assigned = getAssigned(leader);

    container.innerHTML = `
      <div style="padding:20px; color: black;">
        <h2>${leader.nombre}</h2>
        <p><strong>Cédula:</strong> ${leader.cedula}</p>

        <h3>Soldados asignados</h3>
        ${
          assigned.length
            ? `<ul>${assigned
                .map((m) => `<li>${m.nombre} — ${m.cedula}</li>`)
                .join("")}</ul>`
            : "<p>Sin soldados asignados</p>"
        }
      </div>
    `;

    const html = container.innerHTML;
    const original = document.body.innerHTML;

    document.body.innerHTML = html;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  /** -----------------------------------------------------------------------------
   *                                   EXPORTAR EXCEL
   ------------------------------------------------------------------------------*/
  const exportIndividualTeam = (leader) => {
    const assigned = getAssigned(leader);

    if (!assigned.length) {
      setNotification({
        message: `El pelotón de ${leader.nombre} está vacío.`,
        type: "error",
      });
      return;
    }

    const rows = assigned.map((m) => ({
      Líder: leader.nombre,
      Soldado: m.nombre,
      Cédula: m.cedula || "N/A",
      Email: m.email,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Peloton_${leader.nombre}`);
    XLSX.writeFile(wb, `Peloton_${leader.nombre.replace(/\s/g, "_")}.xlsx`);
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="manage-container comandos-container">
      <div className="comandos-header">
        <h2>Gestión de Pelotones</h2>

        <div className="no-print" style={{ display: "flex", gap: "10px" }}>
          <button
            className="action-btn excel-btn"
            onClick={() => {
              const data = leaders.map((l) => ({
                Líder: l.nombre,
                Cédula: l.cedula,
                "Total Soldados": getAssigned(l).length,
              }));

              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Global");
              XLSX.writeFile(wb, "Resumen_Global_Equipos.xlsx");
            }}
          >
            <FaFileExcel /> Exportar Global
          </button>

          <button className="action-btn print-btn" onClick={handlePrintGlobal}>
            <FaPrint /> Imprimir Global
          </button>
        </div>
      </div>

      {leaders.map((leader) => {
        const assigned = getAssigned(leader);
        const isOpen = expanded === leader.id;

        return (
          <div key={leader.id} className="nivel-section">
            <div
              className="nivel-header"
              onClick={() => setExpanded(isOpen ? null : leader.id)}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <AvatarFoto
                  cedula={leader.cedula}
                  nombre={leader.nombre}
                  size="45px"
                />
                <div>
                  <strong>{leader.nombre}</strong>
                  <div className="counter-badge">
                    {assigned.length}{" "}
                    {assigned.length === 1 ? "soldado" : "soldados"}
                  </div>
                </div>
              </div>

              <span>{isOpen ? "▲" : "▼"}</span>
            </div>

            <div className={`nivel-content ${isOpen ? "expanded" : ""}`}>
              {/* ------------------ SOLDADOS ASIGNADOS ------------------ */}
              <h4>Soldados Asignados</h4>

              {assigned.length ? (
                <div className="renglones-list">
                  {assigned.map((m) => (
                    <div className="comando-item-view" key={m.id}>
                      <div className="col-avatar">
                        <AvatarFoto
                          cedula={m.cedula}
                          nombre={m.nombre}
                          size="35px"
                        />
                      </div>

                      <div className="col-info">
                        <span className="info-name">{m.nombre}</span>
                        <span className="sector-text">{m.cedula}</span>
                      </div>

                      <div className="col-actions no-print">
                        <button
                          className="icon-btn delete"
                          onClick={() => unassign(leader.id, m.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-level">Sin soldados asignados</p>
              )}

              {/* ------------------ DISPONIBLES ------------------ */}
              <h4 style={{ marginTop: "25px" }}>
                Asignar Soldados Disponibles
              </h4>

              {available.length ? (
                <div className="renglones-list">
                  {available.map((m) => (
                    <div className="comando-item-view" key={m.id}>
                      <div className="col-avatar">
                        <AvatarFoto
                          cedula={m.cedula}
                          nombre={m.nombre}
                          size="35px"
                        />
                      </div>

                      <div className="col-info">
                        <span className="info-name">{m.nombre}</span>
                        <span className="sector-text">{m.cedula}</span>
                      </div>

                      <div className="col-actions no-print">
                        <button
                          className="icon-btn edit"
                          onClick={() => assign(leader.id, m.id)}
                        >
                          Asignar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-level">No hay soldados disponibles</p>
              )}

              {/* ------------------ ACCIONES INDIVIDUALES ------------------ */}
              <div
                className="no-print"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                  gap: "10px",
                }}
              >
                <button
                  className="action-btn excel-btn"
                  onClick={() => exportIndividualTeam(leader)}
                >
                  <FaFileExcel /> Exportar Pelotón
                </button>

                <button
                  className="action-btn print-btn"
                  onClick={() => handlePrintTeam(leader)}
                >
                  <FaPrint /> Imprimir Pelotón
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ÁREA PARA IMPRESIÓN GLOBAL */}
      <div id="print-area-global" style={{ display: "none" }}>
        {leaders.map((leader) => {
          const assigned = getAssigned(leader);
          return (
            <div key={leader.id} style={{ marginBottom: "40px" }}>
              <h2>{leader.nombre}</h2>
              <p>Cédula: {leader.cedula}</p>

              {assigned.length ? (
                <ul>
                  {assigned.map((m) => (
                    <li key={m.id}>
                      {m.nombre} — {m.cedula}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Sin soldados asignados</p>
              )}

              <hr />
            </div>
          );
        })}
      </div>

      {/* ÁREA PARA IMPRESIÓN INDIVIDUAL */}
      <div id="print-area-single" style={{ display: "none" }}></div>
    </div>
  );
}

export default ManageTeams;
