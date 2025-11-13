// Componente accesible solo por el rol 'admin' para organizar el organigrama (Comandos).

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import * as XLSX from "xlsx"; // IMPORTAR XLSX
import {
  FaEdit,
  FaFileExcel, 
  FaSave,
  FaTimes,
  FaPlus,
  FaAngleDown,
  FaTrashAlt,
  FaFilter,
} from "react-icons/fa"; 
import "./Comandos.css";

// 1. IMPORTAR LA ESTRUCTURA ZONAL COMPLETA
import { ZONAS_DISPONIBLES, MAPA_CENTROS_POR_ZONA } from "./ZonasElectorales";


// Estructura de datos predefinida para la jerarquía de comandos
const JERARQUIA = ["Municipal", "Zonal", "Sectorial"];

// Nombre de la colección en Firestore para guardar el organigrama
const COLECCION_COMANDOS = "organigrama";

// ⚠️ Se eliminan las constantes de ejemplo ZONAS_EJEMPLO y SECTORES_EJEMPLO,
// y se usa ZONAS_DISPONIBLES y una función que usa MAPA_CENTROS_POR_ZONA si se requiere.

function Comandos() {
  const [organigrama, setOrganigrama] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedSection, setExpandedSection] = useState(JERARQUIA[0]);

  const [filtros, setFiltros] = useState({ rol: "", zona: "", sector: "" });

  // Lógica para obtener Centros/Sectores basada en el filtro Zonal
  const getSectoresDisponibles = (zona) => {
    // Si hay una zona filtrada, devuelve solo los centros de esa zona.
    if (zona && MAPA_CENTROS_POR_ZONA[zona]) {
      return MAPA_CENTROS_POR_ZONA[zona];
    }
    // Si no, aplanar todos los centros de votación para el filtro Sectorial general
    // Opcional: si la lista es muy grande, es mejor no aplanarla.
    // Para simplificar, si no hay zona seleccionada, se muestra una lista general de ejemplo
    // o se pide al usuario filtrar primero por zona. Usaremos solo una lista aplanada para fines de demostración:
    return Object.values(MAPA_CENTROS_POR_ZONA).flat();
  };

  // ... [El resto de useEffects y funciones (handleSave, getUsername, handleExport) se mantienen igual,
  // ya que solo usan las variables de estado y la lógica interna.]

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data(),
          displayName: `${doc.data().nombre} (${doc.data().rol})`,
        }));
        setUsuarios(userList);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLECCION_COMANDOS),
      (snapshot) => {
        const data = {};
        snapshot.docs.forEach((doc) => {
          data[doc.id] = doc.data().renglones || [];
        });
        setOrganigrama(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al suscribirse al organigrama:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddField = (nivel) => {
    let newRenglon = { rol: "", usuarioId: "" };
    if (nivel === "Zonal") {
      newRenglon = { ...newRenglon, zona: "" };
    } else if (nivel === "Sectorial") {
      newRenglon = { ...newRenglon, sector: "" };
    }
    setOrganigrama((prev) => ({
      ...prev,
      [nivel]: [...(prev[nivel] || []), newRenglon],
    }));
    setIsEditing(true);
  };

  const handleChange = (nivel, index, field, value) => {
    setOrganigrama((prev) => {
      const newRenglones = [...(prev[nivel] || [])];
      newRenglones[index] = { ...newRenglones[index], [field]: value };
      return { ...prev, [nivel]: newRenglones };
    });
  };

  const handleRemoveField = (nivel, index) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este renglón?")) {
      setOrganigrama((prev) => {
        const newRenglones = (prev[nivel] || []).filter((_, i) => i !== index);
        return { ...prev, [nivel]: newRenglones };
      });
    }
  };

  const handleSave = async (nivel) => {
    try {
      setNotification(null);
      setLoading(true);

      const renglonesLimpios = (organigrama[nivel] || []).filter(
        (r) => r.rol && r.usuarioId
      );

      await setDoc(doc(db, COLECCION_COMANDOS, nivel), {
        renglones: renglonesLimpios,
      });

      setNotification({
        message: `Comando ${nivel} guardado con éxito.`,
        type: "success",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar el organigrama:", error);
      setNotification({
        message: `Error al guardar el Comando ${nivel}.`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (userId) => {
    const user = usuarios.find((u) => u.uid === userId);
    return user ? user.displayName : "Usuario no asignado/No encontrado";
  };

  const getSimpleUsername = (userId) => {
    const user = usuarios.find((u) => u.uid === userId);
    return user ? user.nombre : "N/A";
  };

  const filteredRenglones = useMemo(() => {
    return (nivel) => {
      const renglones = organigrama[nivel] || [];
      const { rol, zona, sector } = filtros;

      return renglones.filter((renglon) => {
        const rolMatch =
          !rol || renglon.rol.toLowerCase().includes(rol.toLowerCase());
        let zonaMatch = true;
        let sectorMatch = true;

        if (nivel === "Zonal") {
          zonaMatch = !zona || renglon.zona === zona;
        } else if (nivel === "Sectorial") {
          sectorMatch = !sector || renglon.sector === sector;
        }

        return rolMatch && zonaMatch && sectorMatch;
      });
    };
  }, [organigrama, filtros]);

  const handleFilterChange = (field, value) => {
    // Si cambia la zona, reseteamos el sector para forzar el filtrado en cascada
    if (field === "zona") {
        setFiltros((prev) => ({ ...prev, zona: value, sector: "" }));
    } else {
        setFiltros((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleExport = (nivel) => {
    const dataToExport = filteredRenglones(nivel).map((renglon) => {
      const baseData = {
        Rol: renglon.rol || "N/A",
        UsuarioAsignado: getSimpleUsername(renglon.usuarioId),
      };

      if (nivel === "Zonal") {
        baseData.Zona = renglon.zona || "Sin asignar";
      } else if (nivel === "Sectorial") {
        baseData.Sector = renglon.sector || "Sin asignar";
      }
      return baseData;
    });

    if (dataToExport.length === 0) {
      alert("No hay datos filtrados para exportar en este nivel.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Comando ${nivel}`);

    const fileName = `Organigrama_${nivel}_Filtrado.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    setNotification({
      message: `Exportado ${dataToExport.length} renglones del Comando ${nivel}.`,
      type: "success",
    });
  };

  if (loading && !Object.keys(organigrama).length)
    return <p className="loading-state">Cargando módulo de Comandos...</p>;

  return (
    <div className="comandos-container">
      <h2>Gestión de Comandos</h2>
      <p className="subtitle-comandos">
        Organigrama jerárquico de la campaña (Roles, Asignación de Soldados,
        Zona/Sector).
      </p>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="accordion-comandos">
        {JERARQUIA.map((nivel) => (
          <div key={nivel} className="comando-section">
            {/* Cabecera Desplegable */}
            <div
              className={`comando-header ${
                expandedSection === nivel ? "expanded" : ""
              }`}
              onClick={() =>
                setExpandedSection(expandedSection === nivel ? null : nivel)
              }
            >
              <h3>Comando {nivel}</h3>
              <div className="header-actions">
                
                {/* BOTÓN DE EXPORTAR */}
                {organigrama[nivel] && organigrama[nivel].length > 0 && (
                  <button
                    className="icon-button export-button"
                    title={`Exportar Comando ${nivel} (Filtrado)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(nivel); 
                    }}
                  >
                    <FaFileExcel />
                  </button>
                )}

                <button
                  className="icon-button edit-button"
                  title="Editar Organización"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setExpandedSection(nivel);
                  }}
                  disabled={isEditing}
                >
                  <FaEdit />
                </button>
                
                <FaAngleDown
                  className={`expand-icon ${
                    expandedSection === nivel ? "rotate" : ""
                  }`}
                />
              </div>
            </div>

            {/* Contenido (Desplegable) */}
            {expandedSection === nivel && (
              <div className="comando-content">
                {/* Controles de Filtrado Condicionales */}
                <div className="filter-controls">
                  <FaFilter className="filter-icon" />
                  <input
                    type="text"
                    placeholder="Filtrar por Rol..."
                    value={filtros.rol}
                    onChange={(e) => handleFilterChange("rol", e.target.value)}
                    className="filter-input"
                  />

                  {/* FILTRO ZONAL: USA LA CONSTANTE REAL */}
                  {nivel === "Zonal" && (
                    <select
                      value={filtros.zona}
                      onChange={(e) => handleFilterChange("zona", e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Todas las Zonas</option>
                      {ZONAS_DISPONIBLES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* FILTRO SECTORIAL: USA LA LÓGICA DE CENTROS */}
                  {nivel === "Sectorial" && (
                    <>
                        {/* Se recomienda filtrar primero por Zona si el Sectorial es largo */}
                        <select
                            value={filtros.zona}
                            onChange={(e) => handleFilterChange("zona", e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Filtrar por Zona...</option>
                            {ZONAS_DISPONIBLES.map((z) => (
                                <option key={z} value={z}>
                                    {z}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtros.sector}
                            onChange={(e) => handleFilterChange("sector", e.target.value)}
                            className="filter-select"
                            disabled={!filtros.zona} // Deshabilitar si no hay zona seleccionada
                        >
                            <option value="">Todos los Sectores/Centros</option>
                            {filtros.zona && getSectoresDisponibles(filtros.zona).map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </>
                  )}
                </div>

                <div className="renglones-list">
                  {filteredRenglones(nivel).map((renglon, index) => (
                    <div
                      key={index} 
                      className={`renglon-item ${
                        isEditing ? "editing" : "viewing"
                      }`}
                    >
                      {isEditing ? (
                        <>
                          {/* Campo de Rol */}
                          <input
                            type="text"
                            placeholder="Rol (Ej: Encargado de Multiplicación)"
                            value={renglon.rol}
                            onChange={(e) =>
                              handleChange(
                                nivel,
                                organigrama[nivel].findIndex((r) => r === renglon),
                                "rol",
                                e.target.value
                              )
                            }
                            className="rol-input"
                          />

                          {/* Campo de Zona (Solo para Zonal) */}
                          {nivel === "Zonal" && (
                            <select
                              value={renglon.zona || ""}
                              onChange={(e) =>
                                handleChange(
                                  nivel,
                                  organigrama[nivel].findIndex((r) => r === renglon),
                                  "zona",
                                  e.target.value
                                )
                              }
                              className="zona-select"
                            >
                              <option value="">-- Asignar Zona --</option>
                              {ZONAS_DISPONIBLES.map((z) => (
                                <option key={z} value={z}>
                                  {z}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Campo de Sector (Solo para Sectorial) */}
                          {nivel === "Sectorial" && (
                            <>
                              <select
                                value={renglon.zona || ""}
                                onChange={(e) =>
                                    handleChange(
                                      nivel,
                                      organigrama[nivel].findIndex((r) => r === renglon),
                                      "zona",
                                      e.target.value
                                    )
                                }
                                className="zona-select"
                              >
                                <option value="">-- Seleccionar Zona --</option>
                                {ZONAS_DISPONIBLES.map((z) => (
                                  <option key={z} value={z}>
                                    {z}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={renglon.sector || ""}
                                onChange={(e) =>
                                  handleChange(
                                    nivel,
                                    organigrama[nivel].findIndex((r) => r === renglon),
                                    "sector",
                                    e.target.value
                                  )
                                }
                                className="sector-select"
                                disabled={!renglon.zona}
                              >
                                <option value="">-- Asignar Sector/Centro --</option>
                                {renglon.zona && MAPA_CENTROS_POR_ZONA[renglon.zona].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </>
                          )}

                          {/* Campo de Soldado */}
                          <select
                            value={renglon.usuarioId}
                            onChange={(e) =>
                              handleChange(
                                nivel,
                                organigrama[nivel].findIndex((r) => r === renglon),
                                "usuarioId",
                                e.target.value
                              )
                            }
                            className="usuario-select"
                          >
                            <option value="">-- Asignar Soldado --</option>
                            {usuarios.map((u) => (
                              <option key={u.uid} value={u.uid}>
                                {u.displayName}
                              </option>
                            ))}
                          </select>

                          {/* Botón de Eliminar */}
                          <button
                            onClick={() =>
                              handleRemoveField(
                                nivel,
                                organigrama[nivel].findIndex((r) => r === renglon)
                              )
                            }
                            className="remove-field-button"
                            title="Eliminar Renglón"
                          >
                            <FaTrashAlt />
                          </button>
                        </>
                      ) : (
                        // Vista de Lectura (Read Only)
                        <div className="view-mode">
                          <strong className="view-rol">{renglon.rol}</strong>
                          {nivel === "Zonal" && (
                            <span className="view-zona">
                              ({renglon.zona || "Sin Zona"})
                            </span>
                          )}
                          {nivel === "Sectorial" && (
                            <span className="view-sector">
                              ({renglon.sector || "Sin Sector"})
                            </span>
                          )}
                          <span className="view-separator">asignado a:</span>
                          <span className="view-user">
                            {getUsername(renglon.usuarioId)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Botones de Edición */}
                  {isEditing && (
                    <div className="editing-actions">
                      <button
                        onClick={() => handleAddField(nivel)}
                        className="add-field-button"
                      >
                        <FaPlus /> Añadir Renglón
                      </button>
                      <button
                        onClick={() => handleSave(nivel)}
                        className="save-changes-button"
                        disabled={loading}
                      >
                        <FaSave /> {loading ? "Guardando..." : "Guardar Comando"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="cancel-button"
                      >
                        <FaTimes /> Cancelar
                      </button>
                    </div>
                  )}

                  {/* Mensaje de vacío */}
                  {filteredRenglones(nivel).length === 0 && (
                    <p className="empty-state">
                      {isEditing
                        ? "Aún no hay renglones. Añade uno para comenzar."
                        : "No se encontraron renglones que coincidan con los filtros."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Comandos;
