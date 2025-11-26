import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import "./MyTeam.css";
import AvatarFoto from "./AvatarFoto"; // <--- IMPORTAR COMPONENTE

function MyTeam({ user }) {
  const [teamMembersWithMetrics, setTeamMembersWithMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.rol !== "lider de zona") {
      setLoading(false);
      setTeamMembersWithMetrics([]);
      return;
    }

    const teamQuery = query(
      collection(db, "users"),
      where("liderAsignado", "==", user.uid)
    );

    const unsubscribeTeam = onSnapshot(
      teamQuery,
      async (teamSnapshot) => {
        let membersData = teamSnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data(),
        }));
        const memberIds = membersData.map((member) => member.uid);

        if (memberIds.length === 0) {
          setTeamMembersWithMetrics([]);
          setLoading(false);
          return;
        }

        try {
          const simpatizantesQuery = query(
            collection(db, "simpatizantes"),
            where("registradoPor", "in", memberIds)
          );
          const simpatizantesSnapshot = await getDocs(simpatizantesQuery);
          const registrationCounts = {};

          simpatizantesSnapshot.forEach((doc) => {
            const registeredBy = doc.data().registradoPor;
            registrationCounts[registeredBy] =
              (registrationCounts[registeredBy] || 0) + 1;
          });

          const membersWithMetrics = membersData.map((member) => ({
            ...member,
            registrationCount: registrationCounts[member.uid] || 0,
          }));

          setTeamMembersWithMetrics(membersWithMetrics);
        } catch (error) {
          console.error(
            "Error al obtener las métricas de los simpatizantes:",
            error
          );
          setTeamMembersWithMetrics(
            membersData.map((m) => ({ ...m, registrationCount: "Error" }))
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error al obtener los miembros del equipo:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTeam();
    };
  }, [user]);

  // FUNCIÓN DE EXPORTACIÓN A EXCEL
  const handleExport = () => {
    if (teamMembersWithMetrics.length === 0) {
      alert("No hay miembros del equipo para exportar.");
      return;
    }
    
    const dataToExport = teamMembersWithMetrics.map((member) => ({
      Nombre: member.nombre || "N/A",
      Cedula: member.cedula || "N/A",
      Email: member.email || "N/A",
      Rol: member.rol || "N/A",
      Registros: member.registrationCount || 0,
    })); 

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MiEquipo");

    const fileName = `Mi_Peloton_${user.nombre.replace(/\s/g, "_")}_${new Date()
      .toLocaleDateString("es-DO")
      .replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    alert(
      `Se han exportado ${teamMembersWithMetrics.length} miembros del equipo.`
    );
  };
  
  if (loading) {
    return <p>Cargando información del peloton...</p>;
  }

  if (user.rol !== "lider de zona") {
    return (
      <div className="my-team-container">
        <p>Esta sección solo está disponible para líderes de zona.</p>
      </div>
    );
  }

  return (
    <div className="my-team-container glass-panel">
      {/* Botón de Exportar */}
      {teamMembersWithMetrics.length > 0 && (
        <div className="team-actions-bar">
          <p className="team-size">
            Miembros del Pelotón: <strong>{teamMembersWithMetrics.length}</strong>
          </p>
          <button
            onClick={handleExport}
            className="export-excel-button team-export-button"
            disabled={loading}
          >
            Exportar a Excel
          </button>
        </div>
      )}
      
      {/* Tabla del Equipo */}
      {teamMembersWithMetrics.length > 0 ? (
        <div className="table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>Foto</th> {/* Nueva Columna */}
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>
              {teamMembersWithMetrics.map((member) => (
                <tr key={member.id}>
                  {/* Célula de Foto */}
                  <td style={{ width: '50px' }}>
                    <AvatarFoto 
                        cedula={member.cedula} 
                        nombre={member.nombre} 
                        size="40px" 
                    />
                  </td>

                  <td>
                    <div style={{fontWeight: '600'}}>{member.nombre}</div>
                    {member.cedula ? (
                        <small style={{color: '#666'}}>{member.cedula}</small>
                    ) : (
                        <small style={{color: '#e63946'}}>Sin Cédula</small>
                    )}
                  </td>

                  <td>{member.email}</td>
                  <td>
                    <span className={`role-badge role-${member.rol?.replace(/\s+/g, '-')}`}>
                        {member.rol}
                    </span>
                  </td>
                  <td>
                    <div className="count-badge">{member.registrationCount}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        user.rol === "lider de zona" && (
          <p className="empty-team-message">
            Aún no tienes soldados asignados a tu peloton.
          </p>
        )
      )}
    </div>
  );
}

export default MyTeam;


