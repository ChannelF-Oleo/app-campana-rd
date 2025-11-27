import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
// ✅ FIX: Agregados FaFileExcel y FaPrint a los imports
import {
  FaSave,
  FaPlus,
  FaTrashAlt,
  FaEdit,
  FaUserTie,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaTimes,
  FaFileExcel,
  FaPrint,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import AvatarFoto from "./AvatarFoto";
import "./Comandos.css";

// Importación de datos (Asegúrate de que el archivo esté en src/data)
import zonasData from "../data/zonas.json";

const NIVELES = ["Municipal", "Zonal", "Sectorial"];
const LISTA_ZONAS = zonasData.map((z) => z.zona).sort();

const OBTIENE_SECTORES = (zonaNombre) => {
  const zona = zonasData.find((z) => z.zona === zonaNombre);
  return zona ? zona.centros.map((c) => c.nombre) : [];
};

// --- SUBCOMPONENTE: MODAL DE EDICIÓN/CREACIÓN ---
const ComandoModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  users,
  nivel,
}) => {
  const [formData, setFormData] = useState({
    id: Date.now(),
    cargo: "",
    userId: "",
    zona: "",
    sector: "",
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          id: Date.now(),
          cargo: "",
          userId: "",
          zona: "",
          sector: "",
        }
      );
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "zona") newData.sector = ""; // Reset sector al cambiar zona
      return newData;
    });
  };

  if (!isOpen) return null;

  const selectedUser = users.find((u) => u.uid === formData.userId);

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>
            {initialData ? "Editar Cargo" : "Agregar Nuevo Cargo"} ({nivel})
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Previsualización Foto */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <AvatarFoto
              cedula={selectedUser?.cedula}
              nombre={selectedUser?.nombre}
              size="80px"
            />
          </div>

          {/* Formulario */}
          <div className="form-group">
            <label>
              <FaUserTie /> Cargo *
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="Ej: Director de Operaciones"
              value={formData.cargo}
              onChange={(e) => handleChange("cargo", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Responsable *</label>
            <select
              className="role-filter-select"
              value={formData.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
            >
              <option value="">-- Seleccionar Persona --</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          {nivel !== "Municipal" && (
            <div className="form-group">
              <label>
                <FaMapMarkerAlt /> Zona
              </label>
              <select
                className="role-filter-select"
                value={formData.zona}
                onChange={(e) => handleChange("zona", e.target.value)}
              >
                <option value="">-- Seleccionar Zona --</option>
                {LISTA_ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          )}

          {nivel === "Sectorial" && (
            <div className="form-group">
              <label>
                <FaLayerGroup /> Recinto/Sector
              </label>
              <select
                className="role-filter-select"
                value={formData.sector}
                onChange={(e) => handleChange("sector", e.target.value)}
                disabled={!formData.zona}
              >
                <option value="">-- Seleccionar Recinto --</option>
                {formData.zona &&
                  OBTIENE_SECTORES(formData.zona).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="save-button"
            onClick={() => onSave(formData)}
            disabled={!formData.cargo || !formData.userId}
          >
            <FaSave /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
function Comandos() {
  const [users, setUsers] = useState([]);
  const [organigrama, setOrganigrama] = useState({
    Municipal: [],
    Zonal: [],
    Sectorial: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState("Municipal");

  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersList = usersSnap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setUsers(usersList);

        const unsub = onSnapshot(
          doc(db, "organigrama", "estructura"),
          (docSnap) => {
            if (docSnap.exists()) setOrganigrama(docSnap.data());
            setLoading(false);
          }
        );
        return () => unsub();
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ACCIONES ---

  const openModal = (nivel, item = null, index = null) => {
    setEditingLevel(nivel);
    setEditingItem(item); // Si es null, el modal sabrá que es "Crear"
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleSaveFromModal = async (data) => {
    // 1. Copiar el array actual
    const newList = [...(organigrama[editingLevel] || [])];

    if (editingIndex !== null) {
      // Editar existente
      newList[editingIndex] = data;
    } else {
      // Crear nuevo (Agregar al principio)
      newList.unshift(data);
    }

    const newOrganigrama = { ...organigrama, [editingLevel]: newList };

    // 2. Guardar en Firestore
    try {
      await setDoc(doc(db, "organigrama", "estructura"), newOrganigrama);
      setModalOpen(false);
    } catch (error) {
      alert("Error al guardar en la base de datos.");
    }
  };

  const handleDelete = async (nivel, index) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cargo?")) return;

    const newList = [...organigrama[nivel]];
    newList.splice(index, 1);
    const newOrganigrama = { ...organigrama, [nivel]: newList };

    try {
      await setDoc(doc(db, "organigrama", "estructura"), newOrganigrama);
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    NIVELES.forEach((nivel) => {
      const data = (organigrama[nivel] || []).map((item) => {
        const u = users.find((user) => user.uid === item.userId);
        return {
          Cargo: item.cargo,
          Responsable: u ? u.nombre : "Sin asignar",
          Cédula: u ? u.cedula : "N/A",
          Teléfono: u ? u.telefono : "N/A",
          Zona: item.zona || "N/A",
          Sector: item.sector || "N/A",
        };
      });
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, nivel);
      }
    });
    XLSX.writeFile(wb, "Estructura_Comandos.xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return <div className="loading-text">Cargando estructura...</div>;

  return (
    <div className="comandos-container glass-panel">
      <div className="comandos-header no-print">
        <div>
          <h2>Gestión de Comandos</h2>
          <p>Define la estructura jerárquica y asigna responsables.</p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleExportExcel}
            className="action-btn excel-btn"
            title="Exportar Excel"
          >
            <FaFileExcel /> Exportar
          </button>
          <button
            onClick={handlePrint}
            className="action-btn print-btn"
            title="Imprimir"
          >
            <FaPrint /> Imprimir
          </button>
        </div>
      </div>

      {NIVELES.map((nivel) => (
        <div
          key={nivel}
          className={`nivel-section ${expandedLevel === nivel ? "active" : ""}`}
        >
          <div
            className="nivel-header"
            onClick={() =>
              setExpandedLevel(nivel === expandedLevel ? null : nivel)
            }
          >
            <h3>Comando {nivel}</h3>
            <span className="counter-badge">
              {organigrama[nivel]?.length || 0} Cargos
            </span>
          </div>

          {/* Contenido visible */}
          <div
            className={`nivel-content ${
              expandedLevel === nivel ? "expanded" : ""
            }`}
          >
            {/* BOTÓN AGREGAR (Arriba) */}
            <div className="level-actions-top no-print">
              <button className="add-row-btn" onClick={() => openModal(nivel)}>
                <FaPlus /> Agregar Cargo
              </button>
            </div>

            {/* LISTA DE ITEMS */}
            <div className="renglones-list">
              {organigrama[nivel]?.map((item, index) => {
                const u = users.find((user) => user.uid === item.userId);
                return (
                  <div key={item.id} className="comando-item-view">
                    {/* Foto */}
                    <div className="col-avatar">
                      <AvatarFoto
                        cedula={u?.cedula}
                        nombre={u?.nombre}
                        size="45px"
                      />
                    </div>

                    {/* Info */}
                    <div className="col-info">
                      <div className="info-name">
                        {u?.nombre || "Sin asignar"}
                      </div>
                      <div className="info-cargo">{item.cargo}</div>
                    </div>

                    {/* Zona/Sector */}
                    <div className="col-zone">
                      {item.zona && (
                        <span className="zone-tag">{item.zona}</span>
                      )}
                      {item.sector && (
                        <div className="sector-text">{item.sector}</div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="col-actions no-print">
                      <button
                        onClick={() => openModal(nivel, item, index)}
                        className="icon-btn edit"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(nivel, index)}
                        className="icon-btn delete"
                        title="Eliminar"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(!organigrama[nivel] || organigrama[nivel].length === 0) && (
              <p className="empty-level">No hay cargos definidos.</p>
            )}
          </div>
        </div>
      ))}

      {/* MODAL FLOTANTE */}
      <ComandoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFromModal}
        initialData={editingItem}
        nivel={editingLevel}
        users={users}
      />
    </div>
  );
}

export default Comandos;
