import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";
import { subirFotoUsuario } from "../../utils/subirFotoUsuario";
import {
  ROLES_DISPONIBLES,
  USUARIOS_POR_PAGINA,
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  normalizarCedula,
} from "../../constants";

// Inicializar Functions
const functions = getFunctions();
const deleteUserCallable = httpsCallable(functions, "deleteUserAndData");

// Campos/columnas para los exports con foto. `key` referencia propiedades de
// cada objeto de filteredUsers (que ya trae cedula, nombre, telefono, rol,
// zona y registrationCount). Sin Dirección (se está retirando del modelo).
const CAMPOS_PDF_USUARIOS = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Rol", key: "rol" },
  { label: "Zona", key: "zona" },
  { label: "Registros", key: "registrationCount" },
];

const COLUMNAS_EXCEL_USUARIOS = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Rol", key: "rol", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Registros", key: "registrationCount", width: 12 },
];

// ¿La fecha (Timestamp Firestore) cae dentro del rango [desde, hasta]? Los
// límites son cadenas "YYYY-MM-DD" (input date); vacío = sin límite por ese lado.
const enRangoFecha = (ts, desde, hasta) => {
  if (!desde && !hasta) return true;
  if (!ts || !ts.toDate) return false; // filtrando por fecha, sin fecha => fuera
  const d = ts.toDate();
  if (desde && d < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && d > new Date(`${hasta}T23:59:59`)) return false;
  return true;
};

// --- SPINNER DE CARGA ---
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner" aria-label="Cargando"></div>
        <p className="spinner-text">{message}</p>
      </div>
    </div>
  );
}

// --- MODAL DE EDICIÓN (Con Cambio de Foto) ---
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol || ROL_MULTIPLICADOR);
  const [newCedula, setNewCedula] = useState(user.cedula || "");
  const [newTelefono, setNewTelefono] = useState(user.telefono || "");
  const [loadingSave, setLoadingSave] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Formateador de Cédula
  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    let formatted = normalized;
    if (normalized.length > 3)
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    if (normalized.length > 10)
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    setNewCedula(formatted);
  };

  // SUBIR NUEVA FOTO
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que tengamos cédula para nombrar el archivo (misma exigencia que
    // antes: la foto se sube en el acto y la cédula debe existir ya).
    const cleanCedula = newCedula.replace(/-/g, "");
    if (cleanCedula.length !== 11) {
      alert(
        "❌ Error: El usuario debe tener una cédula válida (11 dígitos) antes de subir la foto."
      );
      return;
    }

    setUploading(true);
    try {
      // Lógica compartida (comprimir + subir a Storage) extraída a un util.
      await subirFotoUsuario(file, cleanCedula);
      alert(
        "✅ Foto actualizada correctamente.\n\nNota: Puede tardar unos minutos en reflejarse o requerir recargar la página."
      );
      setUploading(false);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("❌ Error al subir la imagen. Verifica tu conexión.");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    const cleanCedula = newCedula.replace(/-/g, "");

    if (cleanCedula.length > 0 && cleanCedula.length !== 11) {
      setError("La cédula debe tener 11 dígitos.");
      return;
    }

    setLoadingSave(true);
    try {
      await onSave(user.id, {
        rol: newRole,
        cedula: newCedula,
        telefono: newTelefono,
        multiplicadoresAsignados: user.multiplicadoresAsignados,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al guardar los cambios.");
      setLoadingSave(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <h3>Editar Usuario: {user.nombre}</h3>

        {/* ÁREA DE FOTO Y SUBIDA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "20px 0",
            gap: "10px",
          }}
        >
          <AvatarFoto
            cedula={newCedula || user.cedula}
            nombre={user.nombre}
            size="100px"
          />

          {/* Botón de carga de archivo */}
          <label
            className="upload-btn"
            style={{
              cursor: uploading ? "wait" : "pointer",
              color: "#004d99",
              fontSize: "0.9rem",
              fontWeight: "bold",
              padding: "5px 10px",
              border: "1px dashed #004d99",
              borderRadius: "5px",
              backgroundColor: uploading ? "#f0f0f0" : "transparent",
            }}
          >
            {uploading ? "⏳ Subiendo..." : "📷 Subir/Cambiar Foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="form-group">
          <label>Email (No editable):</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="input-disabled"
          />
        </div>

        <div className="form-group">
          <label>Cédula de Identidad:</label>
          <input
            type="text"
            value={newCedula}
            onChange={handleCedulaChange}
            placeholder="001-0000000-0"
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label>Teléfono:</label>
          <input
            type="tel"
            value={newTelefono}
            onChange={(e) => setNewTelefono(e.target.value)}
            placeholder="809-000-0000"
            className="search-input"
            disabled={loadingSave}
          />
        </div>

        <div className="form-group">
          <label htmlFor="role-select">Rol del Usuario:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-filter-select"
            disabled={loadingSave}
          >
            {ROLES_DISPONIBLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={loadingSave || uploading}
          >
            {loadingSave ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loadingSave || uploading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [zonaFilter, setZonaFilter] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [activistaFilter, setActivistaFilter] = useState("todos"); // uid
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Zonas presentes en los usuarios cargados (para poblar el filtro por zona).
  const zonasDisponibles = Array.from(
    new Set(allUsers.map((u) => u.zona).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  // Sectores presentes (derivados del simpatizante vinculado, como la zona).
  const sectoresDisponibles = Array.from(
    new Set(allUsers.map((u) => u.sector).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  // Activistas (usuarios) para el filtro "por activista".
  const activistasDisponibles = [...allUsers]
    .filter((u) => u.nombre)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USUARIOS_POR_PAGINA);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USUARIOS_POR_PAGINA,
    currentPage * USUARIOS_POR_PAGINA
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Regresar al top de la tabla suavemente
    document.querySelector(".table-wrapper")?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsersAndMetrics = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data(),
      }));

      const simpatizantesSnapshot = await getDocs(
        collection(db, "simpatizantes")
      );
      const registrationCounts = {};
      // Mapa cédula normalizada -> datos del simpatizante vinculado (teléfono,
      // zona, dirección). Los usuarios existentes no tienen estos campos en su
      // propio doc, así que se toman del simpatizante con la misma cédula.
      const datosSimpPorCedula = {};
      simpatizantesSnapshot.forEach((doc) => {
        const data = doc.data();
        const registeredBy = data.registradoPor;
        if (registeredBy)
          registrationCounts[registeredBy] =
            (registrationCounts[registeredBy] || 0) + 1;
        const ced = normalizarCedula(data.cedula);
        if (ced && !datosSimpPorCedula[ced]) {
          datosSimpPorCedula[ced] = {
            telefono: data.telefono || "",
            zona: data.zona || "",
            sector: data.sector || "",
            direccion: data.direccion || "",
          };
        }
      });

      usersList = usersList.map((user) => {
        const simp = datosSimpPorCedula[normalizarCedula(user.cedula)] || {};
        return {
          ...user,
          registrationCount: registrationCounts[user.uid] || 0,
          telefono: user.telefono || simp.telefono || "",
          zona: user.zona || simp.zona || "",
          sector: user.sector || simp.sector || "",
          direccion: user.direccion || simp.direccion || "",
        };
      });

      setAllUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirm = window.confirm(
      `¿Estás SEGURO de que quieres eliminar a ${user.nombre}?\n\nEsta acción borrará su acceso y sus datos personales permanentemente.`
    );

    if (confirm) {
      setLoading(true);
      try {
        const result = await deleteUserCallable({ uid: user.uid });
        if (result.data.success) {
          alert("Usuario eliminado correctamente.");
          fetchUsersAndMetrics();
        } else {
          alert("Error al eliminar usuario.");
        }
      } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error de servidor al eliminar usuario.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    const dataToExport = filteredUsers.map((user) => ({
      Nombre: user.nombre || "N/A",
      Cedula: user.cedula || "N/A",
      Telefono: user.telefono || "",
      Rol: user.rol || "N/A",
      Zona: user.zona || "",
      Direccion: user.direccion || "",
      Registros: user.registrationCount || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");
    XLSX.writeFile(workbook, "Usuarios_Filtrados.xlsx");
  };

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    // Reflejar TODOS los filtros activos en el título y el nombre del archivo.
    const partes = [];
    if (zonaFilter !== "todas") partes.push(zonaFilter);
    if (sectorFilter !== "todos") partes.push(sectorFilter);
    if (activistaFilter !== "todos") {
      const act = allUsers.find((u) => u.uid === activistaFilter);
      if (act?.nombre) partes.push(act.nombre);
    }
    if (fechaDesde) partes.push(`desde ${fechaDesde}`);
    if (fechaHasta) partes.push(`hasta ${fechaHasta}`);

    const titulo = partes.length
      ? `Padrón de Usuarios - ${partes.join(" · ")}`
      : "Padrón de Usuarios";
    const fileName = partes.length
      ? `Usuarios_Padron_${partes.join("_").replace(/[\s·]+/g, "_")}.pdf`
      : "Usuarios_Padron.pdf";
    try {
      await generarPadronPDF(filteredUsers, {
        titulo,
        campos: CAMPOS_PDF_USUARIOS,
        fileName,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    try {
      await generarExcelConFoto(filteredUsers, {
        hojaNombre: "Usuarios",
        columnas: COLUMNAS_EXCEL_USUARIOS,
        fileName: "Usuarios_Con_Foto.xlsx",
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando Excel:", error);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  useEffect(() => {
    fetchUsersAndMetrics();
  }, []);

  useEffect(() => {
    let currentUsers = [...allUsers];
    if (roleFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.rol === roleFilter);
    }
    if (zonaFilter !== "todas") {
      currentUsers = currentUsers.filter((user) => user.zona === zonaFilter);
    }
    if (sectorFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.sector === sectorFilter);
    }
    // Por activista: se filtra a un usuario concreto (el activista seleccionado).
    if (activistaFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.uid === activistaFilter);
    }
    // Rango de fechas: sobre createdAt (fecha de alta del usuario).
    if (fechaDesde || fechaHasta) {
      currentUsers = currentUsers.filter((user) =>
        enRangoFecha(user.createdAt, fechaDesde, fechaHasta)
      );
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentUsers = currentUsers.filter(
        (user) =>
          (user.nombre &&
            user.nombre.toLowerCase().includes(lowerSearchTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
          (user.cedula && user.cedula.includes(searchTerm))
      );
    }
    setFilteredUsers(currentUsers);
    setCurrentPage(1); // Resetear a página 1 al filtrar
  }, [
    searchTerm,
    roleFilter,
    zonaFilter,
    sectorFilter,
    activistaFilter,
    fechaDesde,
    fechaHasta,
    allUsers,
  ]);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userId, data) => {
    const userDocRef = doc(db, "users", userId);
    try {
      let dataToUpdate = {
        rol: data.rol,
        // Estándar: cédula SOLO dígitos en Firestore.
        cedula: normalizarCedula(data.cedula),
        telefono: data.telefono || "",
        multiplicadoresAsignados:
          data.rol === ROL_LIDER
            ? data.multiplicadoresAsignados || []
            : [],
      };

      await updateDoc(userDocRef, dataToUpdate);
      alert("Usuario actualizado con éxito.");
      handleCloseModal();
      fetchUsersAndMetrics();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Hubo un error al guardar.");
    }
  };

  return (
    <div className="manage-users-container glass-panel">
      {/* SPINNER GLOBAL (Overlay) */}
      {loading && <LoadingSpinner message="Cargando usuarios..." />}

      <div className="manage-users-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
        >
          + Crear Nuevo Usuario
        </button>
      </div>

      <div className="filters-bar-wrapper">
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Roles</option>
          <option value={ROL_ADMIN}>Administrador</option>
          <option value={ROL_LIDER}>Lider de Zona</option>
          <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
        </select>
        <select
          value={zonaFilter}
          onChange={(e) => setZonaFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todas">Todas las Zonas</option>
          {zonasDisponibles.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Sectores</option>
          {sectoresDisponibles.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>
        <select
          value={activistaFilter}
          onChange={(e) => setActivistaFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Activistas</option>
          {activistasDisponibles.map((act) => (
            <option key={act.uid} value={act.uid}>
              {act.nombre}
            </option>
          ))}
        </select>
        <label className="filtro-fecha">
          <span>Alta desde</span>
          <input
            type="date"
            className="search-input"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </label>
        <label className="filtro-fecha">
          <span>Alta hasta</span>
          <input
            type="date"
            className="search-input"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </label>
      </div>

      {/* Acciones de exportación: fila propia con botones compactos (fuera del
          grid de filtros, para que no ocupen una columna completa cada uno). */}
      <div className="export-actions">
        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          Exportar Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "PDF con foto (padrón)"}
        </button>
        <button
          onClick={handleExportExcelFoto}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "Excel con foto"}
        </button>
      </div>

      {/* Resumen de resultados */}
      <div className="results-summary">
        {filteredUsers.length > 0 ? (
          <span>
            Mostrando{" "}
            <strong>
              {(currentPage - 1) * USUARIOS_POR_PAGINA + 1}–
              {Math.min(currentPage * USUARIOS_POR_PAGINA, filteredUsers.length)}
            </strong>{" "}
            de <strong>{filteredUsers.length}</strong> usuarios
          </span>
        ) : (
          !loading && <span>No se encontraron usuarios.</span>
        )}
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Registros</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Foto" style={{ width: "60px" }}>
                    <AvatarFoto
                      cedula={user.cedula}
                      nombre={user.nombre}
                      size="40px"
                    />
                  </td>
                  <td data-label="Nombre">
                    <div style={{ fontWeight: "600" }}>
                      {user.nombre || "N/A"}
                    </div>
                    {user.cedula ? (
                      <small style={{ color: "#666" }}>{user.cedula}</small>
                    ) : (
                      <small style={{ color: "#e63946" }}>Sin Cédula</small>
                    )}
                  </td>
                  <td data-label="Teléfono">{user.telefono || "—"}</td>
                  <td data-label="Rol">
                    <span
                      className={`role-badge role-${user.rol?.replace(
                        /\s+/g,
                        "-"
                      )}`}
                    >
                      {user.rol || "N/A"}
                    </span>
                  </td>
                  <td data-label="Registros">
                    <div className="count-badge">{user.registrationCount}</div>
                  </td>
                  <td data-label="Acciones" className="actions-cell">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button icon-only"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-button icon-only"
                      title="Eliminar"
                      style={{
                        marginLeft: "8px",
                        borderColor: "#ef4444",
                        color: "#ef4444",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* --- CONTROLES DE PAGINACIÓN --- */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="Primera página"
          >
            «
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            ‹
          </button>

          {/* Números de página */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .reduce((acc, page, idx, arr) => {
              if (idx > 0 && page - arr[idx - 1] > 1) {
                acc.push("...");
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={`pagination-btn ${
                    item === currentPage ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              )
            )}

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Página siguiente"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Última página"
          >
            »
          </button>
        </div>
      )}

      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

export default ManageUsers;
